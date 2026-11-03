import "@livekit/components-styles";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { DisconnectReason, type RoomOptions } from "livekit-client";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";
import { useCourse } from "@/modules/course";
import {
  LessonPreJoin,
  liveApi,
  MIC_TRACK,
  tokenAllowsTrack,
  useLiveToken,
  type LessonPreJoinChoices,
} from "@/modules/live";
import { RateLessonDialog, useLesson, useLessonWaiting } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { LoadingFallback } from "@/shared/ui/legacy";
import { LiveRoom, LiveRoomState, useLeaveGuard } from "@/widgets/live-room";

// adaptiveStream: tomoshabin faqat ko'rinib turgan o'lchamga mos qatlamni oladi (tarmoq va server CPU'ni 2-3x kamaytiradi).
// dynacast: hech kim ko'rmayotgan qatlam yuborilmaydi (o'qituvchi yuklashi kamayadi). Modul darajasida — Room qayta yaratilmasin.
const ROOM_OPTIONS: RoomOptions = { adaptiveStream: true, dynacast: true };

// LiveKit o'zi qayta ulana olmay (~1 daqiqa) uzilsa ham foydalanuvchini darsdan chiqarib yubormaymiz: yangi token olib qayta kiramiz.
// Kutish oraliqlari kengayib boradi (jami ~1,5 daqiqa); hammasi muvaffaqiyatsiz bo'lsagina eski xatti-harakat (darsdan chiqish).
const REJOIN_DELAYS_MS = [1_500, 3_000, 5_000, 8_000, 10_000, 15_000, 15_000, 20_000];
const REJOIN_CONNECT_TIMEOUT_MS = 20_000;
// Dars/xona ataylab yopilgan yoki o'quvchi chetlashtirilgan holatlar — qayta kirilmaydi.
// CLIENT_INITIATED bu yerda YO'Q: kutubxona qayta ulanish bekor bo'lganda ham shu sababni beradi; foydalanuvchining o'z chiqishi
// `leaving` belgisi bilan ajratiladi.
const FINAL_DISCONNECT_REASONS = new Set<DisconnectReason | undefined>([
  DisconnectReason.DUPLICATE_IDENTITY,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.ROOM_CLOSED,
  DisconnectReason.USER_REJECTED,
  DisconnectReason.USER_UNAVAILABLE,
]);

type LiveToken = Awaited<ReturnType<typeof liveApi.getToken>>;

export function LiveLessonPage() {
  const { t } = useTranslation("live");
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lesson = useLesson(lessonId ?? null, 30_000);
  const course = useCourse(lesson.data?.courseId ?? null);
  const token = useLiveToken(lessonId, true);
  const joined = useRef(false);
  const isTeacher = useRef(false);
  const [ratePrompt, setRatePrompt] = useState(false);
  const [choices, setChoices] = useState<LessonPreJoinChoices | null>(null);
  const waiting = useLessonWaiting(lessonId ?? null, !choices);
  const [readyToConnect, setReadyToConnect] = useState(false);
  const isCompact = useIsCompact();
  // Avtomatik qayta kirish: `session` o'zgarsa LiveKitRoom yangidan yaratiladi, `rejoinAttempt` > 0 bo'lsa banner ko'rinadi.
  const [session, setSession] = useState(0);
  const [freshToken, setFreshToken] = useState<LiveToken | null>(null);
  const [rejoinAttempt, setRejoinAttempt] = useState(0);
  const rejoining = useRef(false);
  const rejoinAttempts = useRef(0);
  const rejoinTimer = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined);
  const rejoinStep = useRef<() => void>(() => undefined);
  // Foydalanuvchi chiqayotgan (yoki sahifa yopilayotgan) paytda LiveKit'ning CLIENT_INITIATED uzilishi qayta kirishni boshlamasin.
  const leaving = useRef(false);
  useLayoutEffect(() => {
    leaving.current = false;
    return () => {
      leaving.current = true;
    };
  }, []);

  useEffect(() => {
    if (!choices || !token.data || token.data.joinDelayMs <= 0) return;
    const timer = globalThis.setTimeout(() => setReadyToConnect(true), token.data.joinDelayMs);
    return () => globalThis.clearTimeout(timer);
  }, [choices, token.data]);

  const connected = Boolean(token.data);
  useLeaveGuard(connected && !ratePrompt);

  useEffect(() => {
    if (token.data) {
      joined.current = true;
      isTeacher.current = token.data.isTeacher;
    }
  }, [token.data]);

  useEffect(() => {
    const currentLessonId = lessonId;
    return () => {
      if (joined.current && currentLessonId) {
        joined.current = false;
        liveApi.leave(currentLessonId).catch(() => undefined);
      }
    };
  }, [lessonId]);

  const refetchLesson = lesson.refetch;

  const handleLeave = useCallback(() => {
    leaving.current = true;
    if (isTeacher.current) {
      navigate(-1);
      return;
    }
    refetchLesson()
      .then((result) => {
        if (result.data?.status === "finished") setRatePrompt(true);
        else navigate(-1);
      })
      .catch(() => navigate(-1));
  }, [navigate, refetchLesson]);

  const stopRejoin = useCallback(() => {
    globalThis.clearTimeout(rejoinTimer.current);
    rejoining.current = false;
    rejoinAttempts.current = 0;
    setRejoinAttempt(0);
  }, []);

  // Har chaqiruvda keyingi urinishni rejalashtiradi: kutadi -> dars tugamaganini tekshiradi -> yangi token oladi -> xonani qayta yaratadi.
  // Ulanmasa (yoki yana uzilsa) shu funksiya qayta chaqiriladi; urinishlar tugasa eski xatti-harakat: darsdan chiqish.
  useEffect(() => {
    rejoinStep.current = () => {
      globalThis.clearTimeout(rejoinTimer.current);
      const attempt = rejoinAttempts.current;
      if (attempt >= REJOIN_DELAYS_MS.length) {
        stopRejoin();
        toast.error("Aloqa tiklanmadi — darsga qaytadan kiring");
        handleLeave();
        return;
      }
      rejoinAttempts.current = attempt + 1;
      setRejoinAttempt(attempt + 1);
      rejoinTimer.current = globalThis.setTimeout(() => {
        void (async () => {
          try {
            if (!navigator.onLine) throw new Error("offline");
            const latest = await refetchLesson();
            if (latest.data?.status === "finished") {
              stopRejoin();
              handleLeave();
              return;
            }
            const next = await liveApi.getToken(lessonId as string);
            setFreshToken(next);
            setSession((current) => current + 1);
            // Yangi xona REJOIN_CONNECT_TIMEOUT_MS ichida ulanmasa — yana urinamiz (onConnected bu taymerni to'xtatadi)
            rejoinTimer.current = globalThis.setTimeout(() => rejoinStep.current(), REJOIN_CONNECT_TIMEOUT_MS);
          } catch {
            rejoinStep.current();
          }
        })();
      }, REJOIN_DELAYS_MS[attempt]);
    };
  }, [handleLeave, lessonId, refetchLesson, stopRejoin]);

  useEffect(() => () => globalThis.clearTimeout(rejoinTimer.current), []);

  const handleDisconnected = useCallback(
    (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        toast.error("Siz darsdan chetlashtirildingiz");
        stopRejoin();
        handleLeave();
        return;
      }
      // Foydalanuvchi o'zi chiqyapti (handleLeave allaqachon ishlagan) yoki qayta kirishda eski xona yangisi bilan almashyapti
      if (reason === DisconnectReason.CLIENT_INITIATED && (leaving.current || rejoining.current)) return;
      if (FINAL_DISCONNECT_REASONS.has(reason)) {
        stopRejoin();
        handleLeave();
        return;
      }
      rejoining.current = true;
      rejoinStep.current();
    },
    [handleLeave, stopRejoin]
  );

  const handleConnected = useCallback(() => {
    if (rejoining.current) stopRejoin();
  }, [stopRejoin]);

  if (lesson.isLoading || token.isLoading) {
    return (
      <main className="live-page">
        <LoadingFallback label={t("state.joiningRoom")} />
      </main>
    );
  }

  if (lesson.isError || !lesson.data) {
    return (
      <main className="live-page">
        <LiveRoomState
          title={t("state.notFoundTitle")}
          description={lesson.error?.message}
          actionLabel={t("state.back")}
          onAction={handleLeave}
          onBack={handleLeave}
        />
      </main>
    );
  }

  if (ratePrompt) {
    return (
      <main className="live-page">
        <LiveRoomState
          tone="neutral"
          lessonTitle={lesson.data.title}
          subtitle={lesson.data.courseTitle}
          title={t("state.finishedTitle")}
          description={t("state.finishedDescription")}
          actionLabel={t("state.exit")}
          onAction={() => navigate(-1)}
        />
        <RateLessonDialog
          lesson={lesson.data}
          currentUserId={user?.id}
          onOpenChange={(open) => {
            if (!open) navigate(-1);
          }}
        />
      </main>
    );
  }

  if (token.isError || !token.data) {
    const finished = lesson.data.status === "finished";
    return (
      <main className="live-page">
        <LiveRoomState
          tone="offline"
          title={isCompact && !finished ? t("state.mobileJoinFailedTitle") : t("state.joinFailedTitle")}
          description={
            finished
              ? t("state.joinFailedFinished", {
                  title: lesson.data.title,
                  time: lesson.data.time,
                })
              : isCompact
                ? t("state.mobileJoinFailedDescription")
                : (token.error?.message ?? t("state.joinFailedDescription"))
          }
          actionLabel={finished ? t("state.openRecording") : t("state.retry")}
          onAction={
            finished
              ? () =>
                  navigate(
                    user?.role === ROLES.STUDENT
                      ? ROUTES.student.recording(lesson.data!.id)
                      : ROUTES.teacher.recording(lesson.data!.id)
                  )
              : () => void token.refetch()
          }
          secondaryLabel={isCompact ? t("state.mobileBackToChat") : t("state.backToChat")}
          onSecondary={handleLeave}
        />
      </main>
    );
  }

  if (!choices) {
    return (
      <main className="live-page">
        <LessonPreJoin
          lesson={lesson.data}
          userName={user?.name}
          micAllowed={tokenAllowsTrack(token.data.token, MIC_TRACK)}
          isTeacher={token.data.isTeacher}
          waitingCount={waiting.data?.waitingCount ?? null}
          totalCount={waiting.data?.totalCount ?? null}
          waitingNames={(waiting.data?.students ?? []).map((item) => item.name)}
          teacherName={course.data?.teacher ?? ""}
          onJoin={setChoices}
          onCancel={() => navigate(-1)}
        />
      </main>
    );
  }

  if (!readyToConnect && token.data.joinDelayMs > 0) {
    return (
      <main className="live-page">
        <LoadingFallback label={t("state.joiningRoom")} />
      </main>
    );
  }

  return (
    <main className="live-page">
      {rejoinAttempt > 0 && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
          <span className="flex items-center gap-2.5 rounded-xl bg-saffron-subtle px-4 py-3 text-body-sm text-ink-inverse shadow-lg">
            <Info size={17} className="shrink-0 text-saffron-strong" />
            {t(isCompact ? "room.reconnectingMobile" : "room.reconnecting", {
              attempt: rejoinAttempt,
              total: REJOIN_DELAYS_MS.length,
            })}
          </span>
        </div>
      )}
      <LiveKitRoom
        key={session}
        token={(freshToken ?? token.data).token}
        serverUrl={(freshToken ?? token.data).serverUrl}
        options={ROOM_OPTIONS}
        connect
        audio={choices.micOn}
        video={choices.cameraOn}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onMediaDeviceFailure={(_failure, kind) =>
          toast.error(
            kind === "audioinput"
              ? "Mikrofonni ochib bo‘lmadi — boshqa dastur band qilgan bo‘lishi mumkin"
              : "Kamerani ochib bo‘lmadi — boshqa dastur band qilgan bo‘lishi mumkin"
          )
        }
      >
        <LiveRoom
          lesson={lesson.data}
          isTeacher={token.data.isTeacher}
          screenStream={choices.screenStream ?? null}
          onLeave={handleLeave}
        />
      </LiveKitRoom>
    </main>
  );
}

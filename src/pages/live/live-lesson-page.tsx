import { useCallback, useEffect, useRef, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { DisconnectReason, type RoomOptions } from "livekit-client";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";
import {
  LessonPreJoin,
  liveApi,
  MIC_TRACK,
  tokenAllowsTrack,
  useLiveToken,
  type LessonPreJoinChoices,
} from "@/modules/live";
import { RateLessonDialog, useLesson } from "@/modules/lesson";
import { LoadingFallback } from "@/shared/ui/legacy";
import { LiveRoom, LiveRoomState, useLeaveGuard } from "@/widgets/live-room";

// adaptiveStream: tomoshabin faqat ko'rinib turgan o'lchamga mos qatlamni oladi (tarmoq va server CPU'ni 2-3x kamaytiradi).
// dynacast: hech kim ko'rmayotgan qatlam yuborilmaydi (o'qituvchi yuklashi kamayadi). Modul darajasida — Room qayta yaratilmasin.
const ROOM_OPTIONS: RoomOptions = { adaptiveStream: true, dynacast: true };

export function LiveLessonPage() {
  const { t } = useTranslation("live");
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lesson = useLesson(lessonId ?? null);
  const token = useLiveToken(lessonId, true);
  const joined = useRef(false);
  const isTeacher = useRef(false);
  const [ratePrompt, setRatePrompt] = useState(false);
  const [choices, setChoices] = useState<LessonPreJoinChoices | null>(null);
  const [readyToConnect, setReadyToConnect] = useState(false);

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

  if (lesson.isLoading || token.isLoading) {
    return (
      <main className="live-page">
        <LoadingFallback label="Dars xonasiga ulanmoqda" />
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
          lessonTitle={lesson.data.title}
          subtitle={`${lesson.data.courseTitle} · ${lesson.data.date} · ${lesson.data.time}`}
          title={t("state.joinFailedTitle")}
          description={
            finished
              ? t("state.joinFailedFinished", {
                  title: lesson.data.title,
                  time: lesson.data.time,
                })
              : token.error?.message
          }
          actionLabel={t("state.backToChat")}
          onAction={handleLeave}
          secondaryLabel={finished ? t("state.openRecording") : t("state.retry")}
          onSecondary={
            finished ? () => navigate(`/recordings/${lesson.data!.id}`) : () => void token.refetch()
          }
          onBack={handleLeave}
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
          onJoin={setChoices}
          onCancel={() => navigate(-1)}
        />
      </main>
    );
  }

  if (!readyToConnect && token.data.joinDelayMs > 0) {
    return (
      <main className="live-page">
        <LoadingFallback label="Dars xonasiga ulanmoqda" />
      </main>
    );
  }

  return (
    <main className="live-page">
      <LiveKitRoom
        token={token.data.token}
        serverUrl={token.data.serverUrl}
        options={ROOM_OPTIONS}
        connect
        audio={choices.micOn}
        video={choices.cameraOn}
        onDisconnected={(reason) => {
          if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
            toast.error("Siz darsdan chetlashtirildingiz");
          }
          handleLeave();
        }}
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

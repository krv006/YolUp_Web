import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePreviewTracks } from "@livekit/components-react";
import { Track, type LocalVideoTrack } from "livekit-client";
import { Info, Mic, MicOff, Settings, Video, VideoOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/shared/i18n";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { Switch } from "@/shared/ui/switch";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MediaPermissionDialog } from "./media-permission-dialog";

export interface LessonPreJoinChoices {
  micOn: boolean;
  cameraOn: boolean;
  screenStream?: MediaStream;
}

export interface LessonPreJoinProps {
  lesson: Lesson;
  userName?: string;
  micAllowed?: boolean;
  isTeacher?: boolean;
  /** Xonada kutayotganlar (presence) — sarlavha ostida ko'rsatiladi. */
  waitingCount?: number | null;
  totalCount?: number | null;
  waitingNames?: string[];
  teacherName?: string;
  onJoin: (choices: LessonPreJoinChoices) => void;
  onCancel: () => void;
}

export function LessonPreJoin({
  lesson,
  userName,
  micAllowed = true,
  isTeacher = false,
  waitingCount = null,
  totalCount = null,
  waitingNames = [],
  teacherName = "",
  onJoin,
  onCancel,
}: LessonPreJoinProps) {
  const { t } = useTranslation("live");
  const isCompact = useIsCompact();
  const [micOn, setMicOn] = useState(micAllowed);
  const [cameraOn, setCameraOn] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ attempt: number; denied: boolean; message: string } | null>(
    null
  );
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDeviceError = useCallback(
    (error: Error) =>
      setFailure({
        attempt,
        denied: error.name === "NotAllowedError" || error.name === "SecurityError",
        message: error.message || i18n.t("live:preJoin.deviceErrorFallback"),
      }),
    [attempt]
  );
  const current = failure?.attempt === attempt ? failure : null;
  const deviceError = current?.message ?? null;
  const permissionDenied = Boolean(current?.denied);
  const trackOptions = useMemo(() => ({ audio: micOn, video: cameraOn }), [micOn, cameraOn]);
  const tracks = usePreviewTracks(trackOptions, handleDeviceError);

  const videoTrack = tracks?.find((track) => track.kind === Track.Kind.Video) as
    | LocalVideoTrack
    | undefined;
  const audioTrack = tracks?.find((track) => track.kind === Track.Kind.Audio);
  const micLabel = audioTrack?.mediaStreamTrack?.label || t("preJoin.defaultMic");
  const timeRange = useMemo(() => {
    const start = new Date(lesson.startsAt);
    if (Number.isNaN(start.getTime())) return lesson.time;
    const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60_000);
    const clock = (date: Date) =>
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${clock(start)} – ${clock(end)}`;
  }, [lesson.startsAt, lesson.durationMinutes, lesson.time]);
  const cameraLabel = videoTrack?.mediaStreamTrack?.label || t("preJoin.defaultCamera");

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !videoTrack) return undefined;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  async function join() {
    tracks?.forEach((track) => track.stop());

    if (!isTeacher || isCompact) {
      onJoin({ micOn, cameraOn });
      return;
    }

    if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
      setScreenShareError(t("preJoin.screenShareUnsupported"));
      return;
    }

    setJoining(true);
    setScreenShareError(null);
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, displaySurface: "browser" },
        audio: true,
        systemAudio: "include",
        selfBrowserSurface: "exclude",
      } as DisplayMediaStreamOptions & {
        selfBrowserSurface?: "include" | "exclude";
        systemAudio?: "include" | "exclude";
      });
      if (screenStream.getAudioTracks().length === 0) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenShareError(t("preJoin.screenShareNoAudio"));
        return;
      }
      onJoin({ micOn, cameraOn, screenStream });
    } catch {
      setScreenShareError(t("preJoin.screenSharePermissionDenied"));
    } finally {
      setJoining(false);
    }
  }

  function retryDevices() {
    setFailure(null);
    setAttempt((value) => value + 1);
  }

  function toggleMic() {
    setFailure(null);
    setMicOn((value) => !value);
  }

  function toggleCamera() {
    setFailure(null);
    setCameraOn((value) => !value);
  }

  if (isCompact) {
    const startClock = timeRange.split(" – ")[0] ?? lesson.time;
    const devices = micOn
      ? cameraOn
        ? t("preJoin.mobileBothOn")
        : t("preJoin.mobileMicOnly")
      : cameraOn
        ? t("preJoin.mobileCameraOnly")
        : t("preJoin.mobileBothOff");

    return (
      <main
        data-theme="dark"
        className="dark flex h-dvh min-h-0 flex-col overflow-y-auto bg-canvas px-4 pt-5 pb-9 font-body text-ink [&>*]:shrink-0"
      >
        <header className="flex h-11 items-center gap-3">
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-inverse text-ink-inverse"
            aria-label={t("preJoin.cancel")}
            onClick={onCancel}
          >
            <Icon name="close" size={22} />
          </button>
          <strong className="min-w-0 flex-1 truncate text-center text-title font-semibold">
            {lesson.courseTitle} · {startClock}
          </strong>
          <span className="size-11 shrink-0" aria-hidden="true" />
        </header>

        <div className="relative mt-4 aspect-[358/421] w-full overflow-hidden rounded-2xl bg-subtle">
          {cameraOn && videoTrack ? (
            <video ref={videoRef} className="size-full object-cover" muted playsInline autoPlay />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3">
              <Avatar name={userName || t("preJoin.you")} size="lg" />
              <p className="text-body-sm text-ink-secondary">{t("preJoin.cameraOff")}</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-3.5">
            <button
              type="button"
              className={`grid size-13 place-items-center rounded-full transition-colors disabled:opacity-60 ${
                micOn ? "bg-subtle text-ink" : "bg-danger text-on-action"
              }`}
              aria-pressed={micOn}
              aria-label={micOn ? t("preJoin.muteMicAria") : t("preJoin.unmuteMicAria")}
              disabled={!micAllowed}
              onClick={toggleMic}
            >
              <Icon name="mic" size={22} />
            </button>
            <button
              type="button"
              className={`grid size-13 place-items-center rounded-full transition-colors ${
                cameraOn ? "bg-subtle text-ink" : "bg-danger text-on-action"
              }`}
              aria-pressed={cameraOn}
              aria-label={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
              onClick={toggleCamera}
            >
              <Icon name="videocam-fill" size={22} />
            </button>
            <span className="grid size-13 place-items-center rounded-full bg-subtle text-ink" aria-hidden="true">
              <Icon name="settings" size={22} />
            </span>
          </div>
        </div>

        <h1 className="mt-3.5 text-center font-heading text-title-lg text-ink">{lesson.title || lesson.courseTitle}</h1>
        <p className="mt-1.5 px-4 text-center text-body-sm text-ink-secondary">
          {devices} · {t("preJoin.mobileChangeLater")}
        </p>

        {deviceError && !permissionDenied ? (
          <p className="mt-4 rounded-xl bg-danger-bg px-4 py-3 text-body-sm text-error-text">
            {t("preJoin.deviceErrorMessage", { error: deviceError })}
          </p>
        ) : null}

        <p className="mt-5 flex items-center gap-3 rounded-xl bg-subtle/40 px-3.5 py-[7px] text-body-sm leading-4.5 text-ink">
          <i className="size-2.5 shrink-0 rounded-full bg-danger not-italic" aria-hidden="true" />
          {t("preJoin.mobileRecordingNote")}
        </p>

        <span className="min-h-6 flex-1" />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex h-13 items-center justify-center rounded-full bg-surface-inverse text-title font-semibold text-ink-inverse disabled:opacity-60"
            disabled={joining}
            onClick={onCancel}
          >
            {t("preJoin.mobileCancel")}
          </button>
          <button
            type="button"
            className="flex h-13 items-center justify-center gap-2 rounded-full bg-brand text-title font-semibold text-on-action disabled:opacity-60"
            disabled={joining}
            onClick={join}
          >
            <Icon name="videocam-fill" size={20} />
            {t("preJoin.mobileJoin")}
          </button>
        </div>

        <MediaPermissionDialog
          open={permissionDenied}
          onOpenChange={(open) => {
            if (!open) setFailure(null);
          }}
          onRecheck={retryDevices}
          onJoinWithout={() => {
            tracks?.forEach((track) => track.stop());
            onJoin({ micOn: false, cameraOn: false });
          }}
        />
      </main>
    );
  }

  return (
    <main
      data-theme="dark"
      className="dark flex h-dvh min-h-0 items-center justify-center bg-canvas px-10 text-ink"
    >
      <div className="grid w-full max-w-295 items-center gap-10 lg:grid-cols-[minmax(0,720px)_minmax(0,420px)]">
        <div className="relative aspect-16/10 min-w-0 overflow-hidden rounded-xl bg-subtle">
          {cameraOn && videoTrack ? (
            <video ref={videoRef} className="size-full object-cover" muted playsInline autoPlay />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3">
              <Avatar name={userName || t("preJoin.you")} size="lg" />
              <p className="text-body-sm text-ink-tertiary">{t("preJoin.cameraOff")}</p>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3">
            <button
              type="button"
              className={`grid size-14 place-items-center rounded-full transition-colors ${
                micOn ? "bg-surface-inverse text-ink-inverse" : "bg-danger text-ink"
              }`}
              aria-pressed={micOn}
              aria-label={micOn ? t("preJoin.muteMicAria") : t("preJoin.unmuteMicAria")}
              disabled={!micAllowed}
              onClick={toggleMic}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              type="button"
              className={`grid size-14 place-items-center rounded-full transition-colors ${
                cameraOn ? "bg-surface-inverse text-ink-inverse" : "bg-danger text-ink"
              }`}
              aria-pressed={cameraOn}
              aria-label={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
              onClick={toggleCamera}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <span
              className="grid size-14 place-items-center rounded-full bg-canvas/70 text-ink"
              aria-hidden="true"
            >
              <Settings size={22} />
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-overline text-ink-tertiary uppercase">{t("preJoin.eyebrow")}</span>

          <h1 className="font-heading text-display text-ink">
            {lesson.courseTitle} — {lesson.title}
          </h1>

          <p className="text-body-sm text-ink-secondary">
            {timeRange}
            {!isTeacher && teacherName
              ? ` · ${t("preJoin.teacher", { name: teacherName })}`
              : waitingCount !== null
                ? ` · ${t("preJoin.waiting", { count: waitingCount, total: totalCount ?? waitingCount })}`
                : ` · ${t("preJoin.minutesValue", { count: lesson.durationMinutes })}`}
          </p>

          {waitingNames.length ? (
            <span className="flex items-center gap-2.5">
              <span className="flex items-center gap-2.5">
                {waitingNames.slice(0, 4).map((name) => (
                  <Avatar key={name} name={name} size="xs" />
                ))}
              </span>
              <small className="min-w-0 flex-1 truncate text-body-xs text-ink-tertiary">
                {t(isTeacher ? "preJoin.waitingNames" : "preJoin.inLessonNames", {
                  names: waitingNames.slice(0, 2).join(", "),
                  count: Math.max(waitingNames.length - 2, 0),
                })}
              </small>
            </span>
          ) : null}

          <div className="flex flex-col gap-4">
            <DeviceRow
              icon={<Mic size={20} />}
              title={micOn ? t("preJoin.micOn") : t("preJoin.micOff")}
              hint={micLabel}
              checked={micOn}
              disabled={!micAllowed}
              onChange={toggleMic}
            />
            <DeviceRow
              icon={<Video size={20} />}
              title={cameraOn ? t("preJoin.cameraOnTitle") : t("preJoin.cameraOffTitle")}
              hint={cameraLabel}
              checked={cameraOn}
              onChange={toggleCamera}
            />
          </div>

          <p className="flex items-center gap-2 text-body-xs text-ink-tertiary">
            <Info size={15} className="shrink-0" />
            {isTeacher ? t("preJoin.recordingNote") : t("preJoin.recordingNoteStudent")}
          </p>

          {deviceError ? (
            <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              {t("preJoin.deviceErrorMessage", { error: deviceError })}
            </p>
          ) : null}

          {!micAllowed && isTeacher ? (
            <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              {t("preJoin.micTokenMissing")}
            </p>
          ) : null}

          {screenShareError ? (
            <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger" role="alert">
              {screenShareError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-11">
            <button
              type="button"
              className="flex h-13 items-center rounded-full px-6 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
              disabled={joining}
              onClick={onCancel}
            >
              {t("preJoin.cancel")}
            </button>
            <button
              type="button"
              className="flex h-13 items-center rounded-full bg-brand px-11 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
              disabled={joining}
              onClick={join}
            >
              {isTeacher ? t("preJoin.start") : t("preJoin.join")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function DeviceRow({
  icon,
  title,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <span className="flex items-center gap-3 rounded-md bg-subtle px-4 py-2.5">
      <span className="grid size-5 shrink-0 place-items-center text-ink-secondary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm leading-5 text-ink">{title}</strong>
        <small className="truncate text-body-xs leading-4.5 text-ink-tertiary">{hint}</small>
      </span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={title} />
    </span>
  );
}

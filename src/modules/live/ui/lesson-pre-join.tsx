import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePreviewTracks } from "@livekit/components-react";
import { Track, type LocalVideoTrack } from "livekit-client";
import { Info, Mic, MicOff, Settings, Video, VideoOff, Volume2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { i18n } from "@/shared/i18n";
import type { Lesson } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { Switch } from "@/shared/ui/switch";
import { useIsCompact } from "@/shared/hooks/use-media-query";

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
  onJoin,
  onCancel,
}: LessonPreJoinProps) {
  const { t } = useTranslation("live");
  const isCompact = useIsCompact();
  const [micOn, setMicOn] = useState(micAllowed);
  const [cameraOn, setCameraOn] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDeviceError = useCallback(
    (error: Error) => setDeviceError(error.message || i18n.t("live:preJoin.deviceErrorFallback")),
    []
  );
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

  function toggleMic() {
    setDeviceError(null);
    setMicOn((value) => !value);
  }

  function toggleCamera() {
    setDeviceError(null);
    setCameraOn((value) => !value);
  }

  if (isCompact)
    return (
      <main
        data-theme="dark"
        className="dark flex h-dvh min-h-0 flex-col bg-canvas px-4 pt-3 pb-6 text-ink"
      >
        <div className="flex h-11 shrink-0 items-center gap-2">
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
            aria-label={t("preJoin.cancel")}
            onClick={onCancel}
          >
            <X size={22} />
          </button>
          <strong className="text-title text-ink">{t("preJoin.mobileTitle")}</strong>
        </div>

        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl bg-subtle">
          {cameraOn && videoTrack ? (
            <video ref={videoRef} className="size-full object-cover" muted playsInline autoPlay />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3">
              <Avatar name={userName || t("preJoin.you")} size="lg" />
              <p className="text-body-sm text-ink-tertiary">{t("preJoin.cameraOff")}</p>
            </div>
          )}
          <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-label-strong text-white">
            {micOn ? <Mic size={15} /> : <MicOff size={15} />}
            {t("preJoin.you")}
          </span>
        </div>

        <div className="flex shrink-0 justify-center gap-4 py-4">
          <button
            type="button"
            className={`grid size-12 place-items-center rounded-full transition-colors ${
              micOn ? "bg-subtle text-ink" : "bg-[#d93a3a] text-white"
            }`}
            aria-pressed={micOn}
            aria-label={micOn ? t("preJoin.muteMicAria") : t("preJoin.unmuteMicAria")}
            disabled={!micAllowed}
            onClick={toggleMic}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            type="button"
            className={`grid size-12 place-items-center rounded-full transition-colors ${
              cameraOn ? "bg-subtle text-ink" : "bg-[#d93a3a] text-white"
            }`}
            aria-pressed={cameraOn}
            aria-label={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
            onClick={toggleCamera}
          >
            {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <span
            className="grid size-12 place-items-center rounded-full bg-subtle text-ink"
            aria-hidden="true"
          >
            <Volume2 size={20} />
          </span>
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-h2 text-ink">{lesson.title}</h1>
            <p className="text-body-sm text-ink-tertiary">
              {lesson.courseTitle} · {lesson.date} · {lesson.time} · {lesson.durationMinutes}{" "}
              {t("preJoin.minutes")}
            </p>
          </div>

          {deviceError ? (
            <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
              {t("preJoin.deviceErrorMessage", { error: deviceError })}
            </p>
          ) : null}

          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-full bg-action text-title text-on-action transition-colors hover:bg-action-hover disabled:opacity-60"
            disabled={joining}
            onClick={join}
          >
            {t("preJoin.join")}
          </button>

          <small className="text-center text-caption text-ink-tertiary">
            {t("preJoin.recordingNote")}
          </small>
        </div>
      </main>
    );

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
            {waitingCount !== null
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
                {t("preJoin.waitingNames", {
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
            {t("preJoin.recordingNote")}
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

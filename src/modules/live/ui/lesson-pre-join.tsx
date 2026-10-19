import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePreviewTracks } from "@livekit/components-react";
import { Track, type LocalVideoTrack } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, Volume2, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { i18n } from "@/shared/i18n";
import type { Lesson } from "@/shared/types";
import { Avatar, Button } from "@/shared/ui/legacy";
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
  onJoin: (choices: LessonPreJoinChoices) => void;
  onCancel: () => void;
}

export function LessonPreJoin({
  lesson,
  userName,
  micAllowed = true,
  isTeacher = false,
  onJoin,
  onCancel,
}: LessonPreJoinProps) {
  const { t } = useTranslation("live");
  const isCompact = useIsCompact();
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
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
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
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
            {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
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
    <div className="pre-join">
      <div className="pre-join-card">
        <div className="pre-join-preview">
          {cameraOn && videoTrack ? (
            <video ref={videoRef} muted playsInline autoPlay />
          ) : (
            <div className="pre-join-placeholder">
              <Avatar name={userName || t("preJoin.you")} size="lg" />
              <p>{t("preJoin.cameraOff")}</p>
            </div>
          )}

          <div className="pre-join-toggles">
            <button
              type="button"
              className={micOn ? "" : "is-off"}
              aria-pressed={micOn}
              aria-label={micOn ? t("preJoin.muteMicAria") : t("preJoin.unmuteMicAria")}
              disabled={!micAllowed}
              title={micAllowed ? undefined : t("preJoin.micDisabledTitle")}
              onClick={toggleMic}
            >
              {micOn ? <Mic size={19} /> : <MicOff size={19} />}
            </button>
            <button
              type="button"
              className={cameraOn ? "" : "is-off"}
              aria-pressed={cameraOn}
              aria-label={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
              onClick={toggleCamera}
            >
              {cameraOn ? <Video size={19} /> : <VideoOff size={19} />}
            </button>
          </div>
        </div>

        <div className="pre-join-info">
          <span className="portal-eyebrow">{t("preJoin.eyebrow")}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.courseTitle}</p>

          {deviceError ? (
            <div className="form-alert">{t("preJoin.deviceErrorMessage", { error: deviceError })}</div>
          ) : null}

          {!micAllowed && isTeacher ? (
            <div className="form-alert">{t("preJoin.micTokenMissing")}</div>
          ) : null}

          {screenShareError ? (
            <div className="form-alert" role="alert">
              {screenShareError}
            </div>
          ) : null}

          {isTeacher ? (
            <p className="portal-muted">
              <Trans
                t={t}
                i18nKey="preJoin.teacherScreenShareNote"
                components={[<strong key="0" />, <strong key="1" />, <strong key="2" />, <strong key="3" />]}
              />
            </p>
          ) : null}

          <p className="portal-muted">
            {micOn ? t("preJoin.micOn") : t("preJoin.micOff")} ·{" "}
            {cameraOn ? t("preJoin.cameraOnSuffix") : t("preJoin.cameraOffSuffix")}.{" "}
            {micAllowed || isTeacher ? t("preJoin.canChangeLater") : t("preJoin.needPermission")}
          </p>

          <div className="pre-join-actions">
            <Button variant="secondary" onClick={onCancel} disabled={joining}>
              {t("preJoin.cancel")}
            </Button>
            <Button onClick={join} loading={joining}>
              {t("preJoin.join")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

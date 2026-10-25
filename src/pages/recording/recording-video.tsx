import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface RecordingVideoProps {
  src: string;
  poster?: string | null;
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const mm = hours ? String(minutes).padStart(2, "0") : String(minutes);
  return `${hours ? `${hours}:` : ""}${mm}:${String(rest).padStart(2, "0")}`;
}

export function RecordingVideo({ src, poster }: RecordingVideoProps) {
  const { t } = useTranslation("lesson");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration > 0 ? Math.min((current / duration) * 100, 100) : 0;

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    video.currentTime = Math.max(0, Math.min(ratio, 1)) * duration;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-inverse">
      <video
        ref={videoRef}
        className="size-full object-cover"
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />

      {!playing ? (
        <button
          type="button"
          className="absolute inset-0 grid place-items-center"
          aria-label={t("recording.play")}
          onClick={toggle}
        >
          <span className="grid size-18 place-items-center rounded-full bg-surface/90 text-brand">
            <Play size={30} fill="currentColor" />
          </span>
        </button>
      ) : null}

      <div className="absolute inset-x-5 bottom-5 flex h-8.5 items-center gap-3 rounded-md bg-surface-inverse/55 px-3 text-ink-inverse backdrop-blur-sm">
        <button
          type="button"
          className="grid size-5 shrink-0 place-items-center"
          aria-label={playing ? t("recording.pause") : t("recording.play")}
          onClick={toggle}
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>

        <small className="shrink-0 text-body-xs tabular-nums">{clock(current)}</small>

        <div
          className="flex h-4 min-w-0 flex-1 cursor-pointer items-center"
          role="presentation"
          onClick={seek}
        >
          <span className="relative h-1 w-full rounded-full bg-ink-inverse/30">
            <i
              className="absolute inset-y-0 left-0 rounded-full bg-ink-inverse not-italic"
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>

        <small className="shrink-0 text-body-xs tabular-nums">{clock(duration)}</small>

        <button
          type="button"
          className="grid size-5 shrink-0 place-items-center"
          aria-label={muted ? t("recording.unmute") : t("recording.mute")}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}

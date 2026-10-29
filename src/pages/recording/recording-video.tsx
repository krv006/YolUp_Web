import { useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface RecordingVideoProps {
  src: string;
  poster?: string | null;
  variant?: "default" | "mobile";
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

export function RecordingVideo({ src, poster, variant = "default" }: RecordingVideoProps) {
  const { t } = useTranslation("lesson");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobile = variant === "mobile";
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration > 0 ? Math.min((current / duration) * 100, 100) : 0;

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      video.volume = volume > 0 ? volume : 0.5;
      video.muted = false;
    } else {
      video.muted = true;
    }
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    video.currentTime = Math.max(0, Math.min(ratio, 1)) * duration;
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface-inverse ${
        mobile ? "aspect-[358/211] rounded-2xl" : "aspect-video rounded-lg"
      }`}
    >
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
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted || event.currentTarget.volume === 0);
          if (event.currentTarget.volume > 0) setVolume(event.currentTarget.volume);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />

      {!playing ? (
        <button
          type="button"
          className="absolute inset-0 grid place-items-center"
          aria-label={t("recording.play")}
          onClick={toggle}
        >
          <span
            className={`grid place-items-center rounded-full text-brand ${
              mobile ? "size-16 bg-surface" : "size-18 bg-surface/90"
            }`}
          >
            <Play size={mobile ? 26 : 30} fill="currentColor" />
          </span>
        </button>
      ) : null}

      <div
        className={`absolute inset-x-5 bottom-5 h-8.5 items-center gap-3 rounded-md bg-surface-inverse/55 px-3 text-ink-inverse backdrop-blur-sm ${
          mobile && !started ? "hidden" : "flex"
        }`}
      >
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
          onClick={toggleMute}
        >
          {muted ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          aria-label={t("recording.volume")}
          className={`h-1 shrink-0 cursor-pointer accent-ink-inverse ${mobile ? "w-14" : "w-20"}`}
          onChange={(event) => changeVolume(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

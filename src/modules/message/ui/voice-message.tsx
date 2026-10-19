import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import type { MessageAttachment } from "@/shared/types";
import { messageApi } from "../api/message.api";

const BARS = Array.from({ length: 32 }, (_, index) => 6 + ((index * 5) % 16));

export function VoiceMessage({
  attachment,
  outgoing = false,
}: {
  attachment: MessageAttachment;
  outgoing?: boolean;
}) {
  const { t } = useTranslation("chat");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        await audioRef.current.play();
        setPlaying(true);
      }
      return;
    }
    try {
      const blob = await messageApi.downloadFile(attachment.messageId, {});
      const audio = new Audio(URL.createObjectURL(blob as Blob));
      audio.ontimeupdate = () => {
        setPosition(audio.currentTime);
        setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      };
      audio.onloadedmetadata = () => setDuration(audio.duration || 0);
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        setPosition(0);
      };
      audioRef.current = audio;
      await audio.play();
      setPlaying(true);
    } catch {
      toast.error(t("attachment.voiceFailed"));
    }
  }

  const total = Math.round(position || duration);

  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <button
        type="button"
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          outgoing ? "bg-white/20 text-on-action" : "bg-action text-on-action"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          void toggle();
        }}
        aria-label={playing ? t("attachment.voicePause") : t("attachment.voicePlay")}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <span className="flex min-w-0 flex-1 items-center gap-[3px]" aria-hidden="true">
        {BARS.map((height, index) => (
          <span
            key={index}
            className={`w-[3px] shrink-0 rounded-full ${
              index / BARS.length <= progress
                ? outgoing
                  ? "bg-on-action"
                  : "bg-action"
                : outgoing
                  ? "bg-on-action/40"
                  : "bg-muted"
            }`}
            style={{ height }}
          />
        ))}
      </span>

      <span
        className={`shrink-0 font-numeric text-caption ${
          outgoing ? "text-on-action/80" : "text-ink-tertiary"
        }`}
      >
        {formatDuration(total)}
      </span>
    </div>
  );
}

function formatDuration(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

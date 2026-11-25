import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AssignmentVoice } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import type { AssignmentVoiceInput } from "../api/homework.dto";
import { AssignmentVoicePlayer, VoiceAudio } from "./assignment-voice-player";

const VOICE_MAX_MS = 10 * 60_000;

export interface VoiceNoteFieldProps {
  existing: AssignmentVoice | null;
  value: AssignmentVoiceInput | null | undefined;
  onChange: (value: AssignmentVoiceInput | null | undefined) => void;
  disabled?: boolean;
}

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function preferredMime(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type));
}

export function VoiceNoteField({ existing, value, onChange, disabled = false }: VoiceNoteFieldProps) {
  const { t } = useTranslation("homework");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const preview = useMemo(() => (value ? URL.createObjectURL(value.file) : null), [value]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  function stop() {
    clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  async function start() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error(t("voice.unsupported"));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error(t("voice.denied"));
      return;
    }
    const mimeType = preferredMime();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setRecording(false);
      const durationMs = Math.min(Date.now() - startedRef.current, VOICE_MAX_MS);
      const blob = new Blob(chunks, { type: (recorder.mimeType || mimeType || "audio/webm").split(";")[0] });
      if (blob.size && durationMs >= 500) onChange({ file: blob, durationMs });
    };
    recorderRef.current = recorder;
    startedRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    recorder.start(1000);
    timerRef.current = setInterval(() => {
      const passed = Date.now() - startedRef.current;
      setElapsed(passed);
      if (passed >= VOICE_MAX_MS) stop();
    }, 250);
  }

  function remove() {
    onChange(existing && value ? undefined : existing ? null : undefined);
  }

  const removeButton = (
    <button
      type="button"
      className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-bg text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
      aria-label={t("voice.remove")}
      disabled={disabled}
      onClick={remove}
    >
      <Icon name="trash" size={18} />
    </button>
  );

  if (recording)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-danger-bg px-3 py-2.5">
        <i className="size-2.5 shrink-0 animate-pulse rounded-full bg-danger not-italic" aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-body-sm text-ink">{t("voice.recording")}</strong>
          <small className="text-caption text-ink-secondary tabular-nums">
            {clock(elapsed)} / {clock(VOICE_MAX_MS)}
          </small>
        </span>
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-danger px-4 text-button text-on-action"
          onClick={stop}
        >
          <Icon name="stop-circle" size={18} />
          {t("voice.stop")}
        </button>
      </div>
    );

  if (preview && value)
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-subtle p-3">
        <span className="flex items-center gap-2 text-body-sm font-medium text-ink">
          <Icon name="mic" size={18} className="text-brand" />
          {t("voice.title")} · {clock(value.durationMs)}
        </span>
        <span className="flex items-center gap-2">
          <VoiceAudio src={preview} className="flex-1" />
          {removeButton}
        </span>
      </div>
    );

  if (existing && value !== null)
    return (
      <div className="flex items-start gap-2">
        <AssignmentVoicePlayer voice={existing} className="flex-1" />
        <span className="pt-9">{removeButton}</span>
      </div>
    );

  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-full border border-dashed border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
      disabled={disabled}
      onClick={() => void start()}
    >
      <Icon name="mic" size={18} className="text-brand" />
      {existing ? t("voice.recordAgain") : t("voice.record")}
    </button>
  );
}

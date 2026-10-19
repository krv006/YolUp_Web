import { useRef, useState } from "react";
import { FileAudio, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { QuizGroup } from "@/shared/types";
import type { GroupDraft } from "../lib/question-draft";

const AUDIO_TYPES = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];
const MAX_AUDIO_MB = 60;
const BARS = Array.from({ length: 48 }, (_, index) => 6 + ((index * 7) % 18));

export interface QuestionGroupEditorProps {
  groups: GroupDraft[];
  savedGroups: QuizGroup[];
  uploading: boolean;
  onChange: (groups: GroupDraft[]) => void;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function AudioPlayer({ src, name, onRemove }: { src: string; name: string; onRemove?: () => void }) {
  const { t } = useTranslation("quiz");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration ? position / duration : 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setPosition(0);
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-action text-on-action"
          aria-label={playing ? t("groups.audioPause") : t("groups.audioPlay")}
          onClick={() => {
            const element = audioRef.current;
            if (!element) return;
            if (playing) {
              element.pause();
              setPlaying(false);
            } else {
              void element.play();
              setPlaying(true);
            }
          }}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-label-strong text-ink">{name}</strong>
          <small className="truncate font-numeric text-caption text-ink-tertiary">
            {formatTime(duration)}
          </small>
        </span>

        {onRemove ? (
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg"
            aria-label={t("groups.removeAudio")}
            onClick={onRemove}
          >
            <Trash2 size={17} />
          </button>
        ) : null}
      </div>

      <span className="flex items-center gap-[2px]" aria-hidden="true">
        {BARS.map((height, index) => (
          <span
            key={index}
            className={`w-[3px] shrink-0 rounded-full ${
              index / BARS.length <= progress ? "bg-action" : "bg-muted"
            }`}
            style={{ height }}
          />
        ))}
      </span>

      <span className="flex items-baseline gap-3 font-numeric text-caption text-ink-tertiary">
        {formatTime(position)}
        <small className="flex-1 text-center font-sans text-caption text-action">
          {t("groups.playOnce")}
        </small>
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function QuestionGroupEditor({
  groups,
  savedGroups,
  uploading,
  onChange,
  onUploadAudio,
  onRemoveAudio,
}: QuestionGroupEditorProps) {
  const { t } = useTranslation("quiz");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [pendingName, setPendingName] = useState<Record<string, string>>({});

  function update(key: string, patch: Partial<GroupDraft>) {
    onChange(groups.map((group) => (group.key === key ? { ...group, ...patch } : group)));
  }

  function pickAudio(group: GroupDraft, file: File | undefined) {
    if (!file || !group.id) return;
    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!AUDIO_TYPES.includes(extension)) {
      toast.error(t("groups.audioFormat", { list: AUDIO_TYPES.join(", ") }));
      return;
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast.error(t("groups.audioTooBig", { size: MAX_AUDIO_MB }));
      return;
    }
    setPendingName((current) => ({ ...current, [group.key]: file.name }));
    onUploadAudio?.(group.id, file);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-action-subtle/40 p-4">
      <div className="flex flex-col gap-0.5">
        <strong className="text-label-strong text-ink">{t("groups.title")}</strong>
        <small className="text-caption text-ink-tertiary">{t("groups.hint")}</small>
      </div>

      {groups.map((group, index) => {
        const saved = group.id ? savedGroups.find((item) => item.id === group.id) : null;
        const pending = uploading && pendingName[group.key];
        return (
          <div key={group.key} className="flex flex-col gap-3 rounded-xl bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-subtle text-caption-strong text-ink-secondary">
                {index + 1}
              </span>
              <input
                className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-body-sm text-ink outline-none"
                value={group.title}
                onChange={(event) => update(group.key, { title: event.target.value })}
                placeholder={t("groups.titlePlaceholder", { number: index + 1 })}
              />
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary transition-colors hover:bg-muted hover:text-ink"
                aria-label={t("groups.removeAria")}
                onClick={() => onChange(groups.filter((item) => item.key !== group.key))}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <textarea
              className="min-h-[90px] w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-body-sm text-ink outline-none"
              rows={4}
              value={group.passage}
              onChange={(event) => update(group.key, { passage: event.target.value })}
              placeholder={t("groups.passagePlaceholder")}
            />

            {group.id ? (
              <div className="flex flex-col gap-2">
                <input
                  ref={(node) => {
                    fileRefs.current[group.key] = node;
                  }}
                  type="file"
                  accept={AUDIO_TYPES.join(",")}
                  hidden
                  onChange={(event) => {
                    pickAudio(group, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />

                {saved?.audioUrl ? (
                  <AudioPlayer
                    src={saved.audioUrl}
                    name={pendingName[group.key] ?? t("groups.audioFile")}
                    onRemove={() => onRemoveAudio?.(group.id as string)}
                  />
                ) : null}

                {pending ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
                    <span className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary">
                        <FileAudio size={17} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-label-strong text-ink">
                          {pendingName[group.key]}
                        </strong>
                        <small className="text-caption text-ink-tertiary">
                          {t("groups.uploadingAudio")}
                        </small>
                      </span>
                    </span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <span className="block h-full w-1/3 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-action" />
                    </span>
                  </div>
                ) : saved?.audioUrl ? null : (
                  <button
                    type="button"
                    className="flex h-11 w-fit items-center gap-2 rounded-xl border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50"
                    disabled={uploading}
                    onClick={() => fileRefs.current[group.key]?.click()}
                  >
                    <FileAudio size={16} /> {t("groups.uploadAudio")}
                  </button>
                )}

                <small className="text-caption text-ink-tertiary">
                  {t("groups.audioHint", { size: MAX_AUDIO_MB })}
                </small>

                {saved?.transcript ? (
                  <details className="rounded-xl bg-subtle p-3">
                    <summary className="cursor-pointer text-label-strong text-ink">
                      {t("groups.transcriptToggle")}
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-caption text-ink-secondary">
                      {saved.transcript}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : (
              <small className="text-caption text-ink-tertiary">{t("groups.audioAfterSave")}</small>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="flex h-11 w-fit items-center gap-2 rounded-xl px-3 text-label-strong text-action transition-colors hover:bg-action-subtle"
        onClick={() =>
          onChange([
            ...groups,
            { key: `g${Date.now()}${groups.length}`, id: null, title: "", passage: "" },
          ])
        }
      >
        <Plus size={16} /> {t("groups.add")}
      </button>
    </div>
  );
}

import { useRef } from "react";
import { FileAudio, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shared/ui/legacy";
import type { QuizGroup } from "@/shared/types";
import type { GroupDraft } from "../lib/question-draft";

const AUDIO_TYPES = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];
const MAX_AUDIO_MB = 60;

export interface QuestionGroupEditorProps {
  groups: GroupDraft[];
  savedGroups: QuizGroup[];
  uploading: boolean;
  onChange: (groups: GroupDraft[]) => void;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
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
    onUploadAudio?.(group.id, file);
  }

  return (
    <div className="quiz-groups">
      <div className="quiz-groups-head">
        <span>{t("groups.title")}</span>
        <small>{t("groups.hint")}</small>
      </div>

      {groups.map((group, index) => {
        const saved = group.id ? savedGroups.find((item) => item.id === group.id) : null;
        return (
          <div key={group.key} className="quiz-group-card">
            <div className="quiz-group-card-head">
              <span className="quiz-group-index">{index + 1}</span>
              <input
                value={group.title}
                onChange={(event) => update(group.key, { title: event.target.value })}
                placeholder={t("groups.titlePlaceholder", { number: index + 1 })}
              />
              <button
                type="button"
                className="quiz-page-row-remove"
                aria-label={t("groups.removeAria")}
                onClick={() => onChange(groups.filter((item) => item.key !== group.key))}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <textarea
              rows={4}
              value={group.passage}
              onChange={(event) => update(group.key, { passage: event.target.value })}
              placeholder={t("groups.passagePlaceholder")}
            />

            {group.id ? (
              <div className="quiz-group-audio">
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
                  <>
                    <audio src={saved.audioUrl} controls preload="none" />
                    <button
                      type="button"
                      className="quiz-page-row-remove"
                      aria-label={t("groups.removeAudio")}
                      onClick={() => onRemoveAudio?.(group.id as string)}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={uploading}
                    onClick={() => fileRefs.current[group.key]?.click()}
                  >
                    <FileAudio size={15} /> {t("groups.uploadAudio")}
                  </Button>
                )}
                <small>{t("groups.audioHint", { size: MAX_AUDIO_MB })}</small>
              </div>
            ) : (
              <small className="quiz-page-hint">{t("groups.audioAfterSave")}</small>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="quiz-page-add-row"
        onClick={() =>
          onChange([...groups, { key: `g${Date.now()}${groups.length}`, id: null, title: "", passage: "" }])
        }
      >
        <Plus size={14} /> {t("groups.add")}
      </button>
    </div>
  );
}

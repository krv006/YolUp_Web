import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { QuizQuestionImage } from "@/shared/types";
import { QUESTION_IMAGE_ACCEPT, pickImageFile } from "../lib/question-image";

export interface QuestionImageFieldProps {
  image: QuizQuestionImage | null;
  textAfter: string;
  uploading?: boolean;
  disabled?: boolean;
  error?: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
  onTextAfter: (value: string) => void;
}

const GHOST =
  "flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-label text-ink transition-colors hover:bg-subtle disabled:opacity-50";

/**
 * Savolga rasm: savol matni rasmdan OLDIN (alohida maydon), `textAfter` rasmdan KEYIN.
 * Rasm tanlash, sudrab tashlash va Ctrl+V — hammasi shu yerga olib keladi (Ctrl+V va tashlash kartada ushlanadi).
 */
export function QuestionImageField({
  image,
  textAfter,
  uploading = false,
  disabled = false,
  error = null,
  onPick,
  onRemove,
  onTextAfter,
}: QuestionImageFieldProps) {
  const { t } = useTranslation("quiz");
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function drop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOver(false);
    const file = pickImageFile(event.dataTransfer.files);
    if (file && !disabled) onPick(file);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept={QUESTION_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onPick(file);
        }}
      />

      {image ? (
        <>
          <div className="flex flex-col items-center gap-3 rounded-lg bg-subtle p-3">
            <img
              src={image.url}
              alt={t("editor.imageAlt")}
              className="max-h-72 w-auto max-w-full rounded-md object-contain"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className={GHOST}
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Icon name="refresh" size={14} /> {uploading ? t("editor.uploadingImage") : t("editor.replaceImage")}
              </button>
              <button type="button" className={GHOST} disabled={disabled || uploading} onClick={onRemove}>
                <Icon name="trash" size={14} /> {t("editor.removeImage")}
              </button>
            </div>
          </div>
          <textarea
            className="min-h-16 w-full resize-y rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface disabled:opacity-60"
            rows={2}
            value={textAfter}
            disabled={disabled}
            placeholder={t("editor.textAfterPlaceholder")}
            onChange={(event) => onTextAfter(event.target.value)}
          />
        </>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          className={`flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-dashed px-4 py-3 text-left transition-colors disabled:opacity-60 ${
            over ? "border-brand bg-brand-subtle" : "border-line-strong bg-subtle hover:bg-muted"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <Icon name="image" size={18} className="shrink-0 text-brand" />
          <span className="text-button text-ink">{uploading ? t("editor.uploadingImage") : t("editor.addImage")}</span>
          <span className="text-body-xs text-ink-tertiary">{t("editor.imageHint")}</span>
        </button>
      )}

      {error ? <small className="text-body-xs text-error-text">{error}</small> : null}
    </div>
  );
}

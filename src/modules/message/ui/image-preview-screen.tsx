import { useMemo, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize } from "@/shared/lib";

export interface ImagePreviewScreenProps {
  files: File[];
  caption: string;
  onCaptionChange: (caption: string) => void;
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onCancel: () => void;
  onSend: () => void;
}

export function ImagePreviewScreen({
  files,
  caption,
  onCaptionChange,
  onRemove,
  onAddMore,
  onCancel,
  onSend,
}: ImagePreviewScreenProps) {
  const { t } = useTranslation("chat");
  const [active, setActive] = useState(0);
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const current = Math.min(active, Math.max(0, files.length - 1));

  return (
    <div
      data-theme="dark"
      className="dark fixed inset-0 z-50 flex flex-col bg-canvas text-ink"
      role="dialog"
      aria-label={t("preview.title", { count: files.length })}
    >
      <header className="flex h-14 shrink-0 items-center gap-3 px-4">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          aria-label={t("preview.cancel")}
          onClick={onCancel}
        >
          <X size={22} />
        </button>
        <strong className="text-title text-ink">
          {t("preview.title", { count: files.length })}
        </strong>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {urls[current] ? (
          <img
            className="max-h-full max-w-full object-contain"
            src={urls[current]}
            alt={files[current]?.name ?? ""}
            draggable={false}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {urls.map((url, index) => (
            <span key={url} className="relative shrink-0">
              <button
                type="button"
                className={`size-14 overflow-hidden rounded-xl border-2 transition-colors ${
                  index === current ? "border-action" : "border-transparent"
                }`}
                onClick={() => setActive(index)}
                aria-label={t("preview.selectAria", { number: index + 1 })}
              >
                <img className="size-full object-cover" src={url} alt="" draggable={false} />
              </button>
              <button
                type="button"
                className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-surface text-ink shadow-xs"
                aria-label={t("preview.removeAria", { number: index + 1 })}
                onClick={() => onRemove(index)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="grid size-14 shrink-0 place-items-center rounded-xl border border-line text-ink-secondary transition-colors hover:bg-subtle"
            aria-label={t("preview.addMore")}
            onClick={onAddMore}
          >
            <Plus size={22} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={caption}
            placeholder={t("preview.captionPlaceholder")}
            aria-label={t("preview.captionPlaceholder")}
            onChange={(event) => onCaptionChange(event.target.value)}
          />
          <button
            type="button"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover"
            aria-label={t("preview.send")}
            onClick={onSend}
          >
            <Send size={20} />
          </button>
        </div>

        <small className="text-center text-caption text-ink-tertiary">
          {t("preview.quality", { size: formatFileSize(total) })}
        </small>
      </div>
    </div>
  );
}

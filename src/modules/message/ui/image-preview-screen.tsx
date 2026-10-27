import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

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
      className="dark fixed inset-0 z-50 flex flex-col bg-canvas font-body text-ink"
      role="dialog"
      aria-label={t("preview.title", { count: files.length })}
    >
      <header className="flex shrink-0 items-center gap-3 px-4 pt-5 lg:h-14 lg:pt-0">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white text-surface transition-opacity hover:opacity-90 lg:size-10 lg:bg-transparent lg:text-ink lg:hover:bg-subtle"
          aria-label={t("preview.cancel")}
          onClick={onCancel}
        >
          <X size={22} />
        </button>
        <strong className="min-w-0 flex-1 text-center text-title text-white lg:flex-none lg:text-left lg:text-ink">
          {t("preview.title", { count: files.length })}
        </strong>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white text-surface transition-opacity hover:opacity-90 lg:hidden"
          aria-label={t("preview.send")}
          onClick={onSend}
        >
          <Icon name="logout" size={22} />
        </button>
      </header>

      <div className="mx-4 mt-4.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent">
        {urls[current] ? (
          <img
            className="max-h-full max-w-full object-contain"
            src={urls[current]}
            alt={files[current]?.name ?? ""}
            draggable={false}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-3 lg:p-4">
        <div className="flex items-center gap-2 overflow-x-auto px-4 pt-4 lg:px-0 lg:pt-0">
          {urls.map((url, index) => (
            <span key={url} className="relative shrink-0">
              <button
                type="button"
                className={`size-14 overflow-hidden rounded-xl border-2 bg-white transition-colors ${
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
            className="grid size-14 shrink-0 place-items-center rounded-xl border-[1.5px] border-dashed border-white/60 text-white transition-colors hover:bg-white/10 lg:border lg:border-solid lg:border-line lg:text-ink-secondary lg:hover:bg-subtle"
            aria-label={t("preview.addMore")}
            onClick={onAddMore}
          >
            <Plus size={22} />
          </button>
        </div>

        <small className="mt-auto px-4 pt-14 text-caption text-white/80 lg:order-last lg:px-0 lg:pt-0 lg:text-center lg:text-ink-tertiary">
          {t("preview.quality", { size: formatFileSize(total) })}
        </small>

        <div className="flex items-center gap-3 bg-surface/50 px-4 pt-2.5 pb-6 lg:bg-transparent lg:p-0">
          <input
            className="h-11 min-w-0 flex-1 rounded-full bg-surface px-4.5 text-body text-white outline-none placeholder:text-white/60 lg:h-12 lg:bg-surface lg:px-5 lg:text-ink lg:placeholder:text-ink-tertiary"
            value={caption}
            placeholder={t("preview.captionPlaceholder")}
            aria-label={t("preview.captionPlaceholder")}
            onChange={(event) => onCaptionChange(event.target.value)}
          />
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover lg:size-12"
            aria-label={t("preview.send")}
            onClick={onSend}
          >
            <Icon name="send" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

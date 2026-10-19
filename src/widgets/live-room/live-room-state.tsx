import type { ReactNode } from "react";
import { ArrowLeft, CircleX } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface LiveRoomStateProps {
  title: string;
  description?: ReactNode;
  lessonTitle?: string;
  subtitle?: string;
  tone?: "error" | "neutral";
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: () => void;
}

export function LiveRoomState({
  title,
  description,
  lessonTitle,
  subtitle,
  tone = "error",
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  onBack,
}: LiveRoomStateProps) {
  const { t } = useTranslation("live");

  return (
    <div
      data-theme="dark"
      className="dark flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink"
    >
      <header className="flex shrink-0 items-center gap-3 px-5 pt-4 pb-3">
        {onBack ? (
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={t("room.leaveAria")}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        {lessonTitle ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <strong className="flex min-w-0 items-center gap-2 font-heading text-title text-ink">
              <span
                className="size-2 shrink-0 rounded-full bg-success"
                aria-hidden="true"
              />
              <span className="truncate">{lessonTitle}</span>
            </strong>
            {subtitle ? (
              <small className="truncate text-caption text-ink-tertiary">
                {subtitle}
              </small>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {tone === "error" ? (
          <span
            data-theme="light"
            className="grid size-16 place-items-center rounded-full bg-error-bg text-error-text"
          >
            <CircleX size={30} />
          </span>
        ) : null}

        <strong className="font-heading text-h1 text-ink">{title}</strong>
        {description ? (
          <p className="max-w-[460px] text-body text-ink-secondary">
            {description}
          </p>
        ) : null}

        {actionLabel && onAction ? (
          <button
            type="button"
            className="mt-2 flex h-12 min-w-[260px] items-center justify-center rounded-full bg-action px-6 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}

        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className="text-label-strong text-action transition-colors hover:text-action-hover"
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

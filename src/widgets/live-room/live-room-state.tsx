import type { ReactNode } from "react";
import { ArrowLeft, CircleX, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface LiveRoomStateProps {
  title: string;
  description?: ReactNode;
  lessonTitle?: string;
  subtitle?: string;
  tone?: "error" | "neutral" | "offline";
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
      {onBack || lessonTitle ? (
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
                <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
                <span className="truncate">{lessonTitle}</span>
              </strong>
              {subtitle ? (
                <small className="truncate text-caption text-ink-tertiary">{subtitle}</small>
              ) : null}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        {tone !== "neutral" ? (
          <span className="mb-5.5 grid size-20 place-items-center rounded-xl bg-danger-bg text-danger">
            {tone === "offline" ? <Wifi size={34} /> : <CircleX size={34} />}
          </span>
        ) : null}

        <strong className="font-heading text-display text-ink">{title}</strong>

        {description ? (
          <p className="mt-3 max-w-125 text-body-sm text-ink-secondary">{description}</p>
        ) : null}

        {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
          <div className="mt-4 flex items-center gap-3">
            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                className="flex h-12 items-center rounded-full px-5 text-button text-ink transition-colors hover:bg-subtle"
                onClick={onSecondary}
              >
                {secondaryLabel}
              </button>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                className="flex h-12 items-center rounded-full bg-brand px-6 text-button text-on-action transition-colors hover:bg-brand-strong"
                onClick={onAction}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

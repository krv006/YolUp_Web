import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/ui/icon";

export function ProfileSubPage({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation("account");

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 lg:hidden">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          onClick={() => navigate(-1)}
          aria-label={t("page.title")}
        >
          <Icon name="arrow-back" size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">{title}</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 lg:px-6 lg:pt-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
          {description ? (
            <p className="text-body-sm text-ink-secondary">{description}</p>
          ) : null}
          {children}
        </div>
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-line bg-surface px-4 py-4 lg:px-6">
          <div className="mx-auto w-full max-w-[720px]">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
        {label}
      </span>
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  icon,
  tone = "bg-action text-on-action",
  title,
  hint,
  right,
  onClick,
  danger = false,
}: {
  icon: string;
  tone?: string;
  title: string;
  hint?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <strong className={`truncate text-label-strong ${danger ? "text-error-text" : "text-ink"}`}>
          {title}
        </strong>
        {hint ? <small className="truncate text-caption text-ink-tertiary">{hint}</small> : null}
      </span>
      {right ?? (onClick ? <Icon name="chevron-right" size={18} className="shrink-0 text-ink-tertiary" /> : null)}
    </>
  );

  if (!onClick) return <div className="flex items-center gap-3 px-4 py-3.5">{content}</div>;

  return (
    <button
      type="button"
      className="flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-subtle"
      onClick={onClick}
    >
      {content}
    </button>
  );
}

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { SETTINGS_TONES } from "./settings-tones";

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
  const isCompact = useIsCompact();

  if (!isCompact) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        {description ? <p className="text-body-sm text-ink-secondary">{description}</p> : null}
        {children}
        {footer ? <div className="flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
        {description ? <p className="text-body-sm text-ink-secondary">{description}</p> : null}
        {children}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-line bg-surface px-4 py-4">{footer}</div>
      ) : null}
    </div>
  );
}

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <span className="text-title text-ink">{label}</span>
      <div className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-surface">
        {children}
      </div>
    </section>
  );
}


export function SettingsRow({
  icon,
  tone = SETTINGS_TONES.brand,
  title,
  hint,
  value,
  right,
  onClick,
  danger = false,
}: {
  icon: string;
  tone?: string;
  title: string;
  hint?: ReactNode;
  value?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={18} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col text-left">
        <strong className={`truncate text-title-sm ${danger ? "text-danger" : "text-ink"}`}>
          {title}
        </strong>
        {hint ? <small className="truncate text-body-xs text-ink-tertiary">{hint}</small> : null}
      </span>

      {value ? (
        <small className="shrink-0 truncate text-body-sm text-ink-secondary">{value}</small>
      ) : null}

      {right}

      {onClick && !right ? (
        <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
      ) : null}
    </>
  );

  if (!onClick) return <div className="flex items-center gap-3 px-4 py-4">{content}</div>;

  return (
    <button
      type="button"
      className="flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-subtle"
      onClick={onClick}
    >
      {content}
    </button>
  );
}

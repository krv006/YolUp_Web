import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { highlightParts, type SupportTicketStatus } from "@/modules/support";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";

export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="bg-transparent text-brand">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

export function HelpCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col overflow-hidden rounded-xl bg-surface ${className}`}>{children}</div>;
}

export function HelpSection({
  title,
  action,
  children,
  className = "",
}: {
  title: ReactNode;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title leading-5 font-normal text-ink">{title}</h2>
        {action ? (
          <button type="button" className="text-body-sm text-brand transition-opacity hover:opacity-80" onClick={action.onClick}>
            {action.label}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function HelpRow({
  icon,
  tone,
  title,
  subtitle,
  trailing,
  onClick,
  chevron = true,
}: {
  icon: string;
  tone: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const isCompact = useIsCompact();
  const body = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className={`truncate font-semibold text-ink ${isCompact ? "text-title" : "text-title-sm"}`}>{title}</strong>
        {subtitle ? <small className="truncate text-body-sm text-ink-secondary">{subtitle}</small> : null}
      </span>
      {trailing}
      {chevron ? <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" /> : null}
    </>
  );
  const className = "flex min-h-[69px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0";
  return onClick ? (
    <button type="button" className={`${className} transition-colors hover:bg-subtle`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

const STATUS_LOOK: Record<SupportTicketStatus, { icon: string; className: string }> = {
  open: { icon: "quiz", className: "bg-brand-subtle text-brand" },
  answered: { icon: "check-circle", className: "bg-success-bg text-success-fg" },
  closed: { icon: "edit", className: "bg-accent-violet-bg text-accent-violet-fg" },
};

export function StatusChip({ status, className = "" }: { status: SupportTicketStatus; className?: string }) {
  const { t } = useTranslation("help");
  const look = STATUS_LOOK[status];
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-caption-strong ${look.className} ${className}`}>
      <Icon name={look.icon} size={14} />
      {t(`status.${status}`)}
    </span>
  );
}

export function ChipTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`flex h-11 shrink-0 items-center justify-center rounded-full border px-4 text-body-sm font-medium whitespace-nowrap transition-colors ${
            value === item.id ? "border-brand bg-brand text-on-action" : "border-line bg-surface text-ink hover:bg-subtle"
          }`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyBlock({
  icon,
  title,
  text,
  action,
  plain = false,
}: {
  icon: string;
  title: ReactNode;
  text?: ReactNode;
  action?: { label: ReactNode; icon?: string; onClick: () => void };
  plain?: boolean;
}) {
  return (
    <section className={`flex flex-col items-center px-6 py-7 text-center ${plain ? "" : "rounded-xl bg-surface"}`}>
      <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
        <Icon name={icon} size={30} />
      </span>
      <strong className="mt-3 font-heading text-title font-medium text-ink">{title}</strong>
      {text ? <p className="mt-2 max-w-[320px] text-body-sm text-ink-secondary">{text}</p> : null}
      {action ? (
        <button
          type="button"
          className="mt-4 flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
          onClick={action.onClick}
        >
          {action.icon ? <Icon name={action.icon} size={18} /> : null}
          {action.label}
        </button>
      ) : null}
    </section>
  );
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface py-1" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="flex animate-pulse items-center gap-3 px-4 py-3.5 motion-reduce:animate-none">
          <i className="h-9 w-11 shrink-0 rounded-sm bg-skeleton not-italic" />
          <i className="size-11 shrink-0 rounded-md bg-skeleton not-italic" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <i className="h-3.5 w-35 max-w-full rounded-full bg-skeleton not-italic" />
            <i className="h-3 w-22.5 rounded-full bg-skeleton not-italic" />
          </span>
        </span>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  const isCompact = useIsCompact();
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <span className="block h-42 animate-pulse rounded-2xl bg-skeleton motion-reduce:animate-none lg:h-54" />
      {isCompact ? <i className="h-4 w-35 rounded-full bg-skeleton not-italic" /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {Array.from({ length: isCompact ? 2 : 3 }, (_, index) => (
          <span key={index} className="block h-25 rounded-xl bg-surface lg:h-27" />
        ))}
      </div>
      {isCompact ? <i className="h-4 w-35 rounded-full bg-skeleton not-italic" /> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <RowsSkeleton rows={4} />
        {isCompact ? null : <RowsSkeleton rows={3} />}
      </div>
    </div>
  );
}

export function OfflineBanner() {
  const { t } = useTranslation("help");
  return (
    <div className="flex h-11 items-center gap-3 rounded-xl bg-surface-inverse px-4 text-body-sm text-ink-inverse" role="status">
      <Icon name="wifi" size={20} />
      {t("states.offline")}
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("help");
  return (
    <section className="flex flex-col items-center rounded-xl bg-surface px-6 py-7 text-center">
      <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
        <Icon name="wifi" size={30} />
      </span>
      <strong className="mt-3 font-heading text-h3 text-ink">{t("states.errorTitle")}</strong>
      <p className="mt-2 max-w-[300px] text-body-sm text-ink-secondary">{t("states.errorText")}</p>
      <button
        type="button"
        className="mt-4 flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
        onClick={onRetry}
      >
        <Icon name="refresh" size={18} />
        {t("states.retry")}
      </button>
    </section>
  );
}

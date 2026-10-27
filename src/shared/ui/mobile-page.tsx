import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

export interface MobilePageHeaderProps {
  title: ReactNode;
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
}

export function MobilePageHeader({ title, backLabel, onBack, action }: MobilePageHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3">
      <button
        type="button"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
        aria-label={backLabel}
        onClick={onBack}
      >
        <Icon name="chevron-left" size={22} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-title-lg text-ink">
        {title}
      </h1>
      {action ?? <span className="size-11 shrink-0" aria-hidden="true" />}
    </header>
  );
}

export const mobileRoundButton =
  "grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted";

export const mobileButton = {
  primary:
    "flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 text-title font-semibold text-on-action transition-colors hover:bg-brand-strong disabled:opacity-40 disabled:hover:bg-brand",
  secondary:
    "flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-title font-semibold text-ink transition-colors hover:bg-subtle disabled:opacity-40",
  danger:
    "flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-danger-bg px-5 text-title font-semibold text-danger transition-opacity hover:opacity-85 disabled:opacity-40",
};

export function MobileActionBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex shrink-0 gap-3 rounded-t-2xl bg-surface px-4 pt-3 pb-8.5 shadow-nav-top ${className}`}>
      {children}
    </div>
  );
}

export interface MobileScreenProps {
  title: ReactNode;
  closeLabel: string;
  closeIcon?: "close" | "chevron-left";
  onClose: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function MobileScreen({
  title,
  closeLabel,
  closeIcon = "close",
  onClose,
  action,
  footer,
  children,
}: MobileScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
        <header className="flex h-11 items-center gap-3">
          <button type="button" className={mobileRoundButton} aria-label={closeLabel} onClick={onClose}>
            <Icon name={closeIcon} size={22} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">{title}</h1>
          {action ?? <span className="size-11 shrink-0" aria-hidden="true" />}
        </header>
        {children}
      </div>
      {footer ? <MobileActionBar>{footer}</MobileActionBar> : null}
    </div>
  );
}

export function MobileWarningNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`flex items-center gap-3 rounded-xl bg-warning-bg px-3.5 py-3 text-body-sm leading-[18px] font-medium text-warning-fg ${className}`}
    >
      <Icon name="warning-fill" size={20} className="shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

export interface MobileTitleHeaderProps {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}

export function MobileTitleHeader({ eyebrow, title, action }: MobileTitleHeaderProps) {
  return (
    <header className="flex shrink-0 items-start gap-3">
      <span className="-mt-0.5 flex min-w-0 flex-1 flex-col gap-0.5">
        <small className="truncate text-caption text-ink-secondary">{eyebrow}</small>
        <h1 className="truncate text-h1 leading-7 font-bold tracking-normal text-ink">{title}</h1>
      </span>
      {action}
    </header>
  );
}

export interface MobileStatsCardProps {
  icon?: string;
  label: ReactNode;
  actionLabel?: ReactNode;
  onAction?: () => void;
  items: Array<{ id: string; value: ReactNode; label: ReactNode }>;
}

export function MobileStatsCard({ icon = "bar-chart", label, actionLabel, onAction, items }: MobileStatsCardProps) {
  return (
    <section className="flex shrink-0 flex-col gap-3.5 rounded-xl bg-brand p-4 pb-[17px] text-on-action">
      <div className="flex h-6 items-center justify-between gap-3">
        <span className="flex h-6 min-w-0 items-center gap-1.5 rounded-full bg-on-action/20 px-2.5 text-caption">
          <Icon name={icon} size={14} className="shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        {actionLabel ? (
          <button type="button" className="shrink-0 text-caption" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex h-15 min-w-0 flex-col justify-center rounded-md bg-on-action/20 pr-1.5 pl-3">
            <strong className="truncate text-[20px] leading-6 font-semibold">{item.value}</strong>
            <small className="truncate text-caption font-normal">{item.label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface MobileListRowProps {
  icon?: string;
  tone?: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  titleClassName?: string;
  chevron?: boolean;
  onClick?: () => void;
}

export function MobileListRow({
  icon,
  tone = "bg-brand-subtle text-brand",
  leading,
  title,
  subtitle,
  trailing,
  titleClassName = "text-ink",
  chevron = true,
  onClick,
}: MobileListRowProps) {
  const body = (
    <>
      {leading ??
        (icon ? (
          <span className={`grid size-10 shrink-0 place-items-center rounded-md ${tone}`}>
            <Icon name={icon} size={20} />
          </span>
        ) : null)}
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className={`truncate text-title ${titleClassName}`}>{title}</strong>
        {subtitle ? <small className="truncate text-body-sm text-ink-secondary">{subtitle}</small> : null}
      </span>
      {trailing}
      {chevron ? <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" /> : null}
    </>
  );
  const className =
    "flex min-h-[69px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:min-h-17 last:border-b-0";
  return onClick ? (
    <button type="button" className={`${className} transition-colors hover:bg-subtle`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function MobileListCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex shrink-0 flex-col overflow-hidden rounded-xl bg-surface py-1 ${className}`}>{children}</div>;
}

export function MobileSectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <h2 className="text-title leading-5 font-normal text-ink">{children}</h2>
      {action}
    </div>
  );
}

export interface MobileSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  clearLabel: string;
  className?: string;
}

export function MobileSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
  className = "",
}: MobileSearchFieldProps) {
  return (
    <label
      className={`flex h-12 shrink-0 items-center gap-3 rounded-full border-[1.5px] border-transparent bg-surface px-3.5 transition-colors focus-within:border-focus ${className}`}
    >
      <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
      <input
        className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-secondary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
      {value ? (
        <button
          type="button"
          className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:text-ink"
          onClick={() => onChange("")}
          aria-label={clearLabel}
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </label>
  );
}

export function MobileListSkeleton({ rows = 5, card = false, className = "" }: { rows?: number; card?: boolean; className?: string }) {
  return (
    <div
      className={`flex shrink-0 flex-col overflow-hidden ${card ? "rounded-xl bg-surface py-1" : ""} ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, index) => (
        <span
          key={index}
          className={`flex animate-pulse items-center gap-3 px-4 motion-reduce:animate-none ${card ? "py-3.5" : "py-5"}`}
        >
          <i className="h-9 w-11 shrink-0 rounded-sm bg-subtle not-italic" />
          <i className="size-11 shrink-0 rounded-md bg-subtle not-italic" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <i className="h-3.5 w-35 max-w-full rounded-full bg-subtle not-italic" />
            <i className="h-3 w-22.5 rounded-full bg-subtle not-italic" />
          </span>
        </span>
      ))}
    </div>
  );
}

export interface MobileEmptyCardProps {
  icon: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: ReactNode; icon?: string; onClick: () => void };
  iconTone?: string;
  descriptionClassName?: string;
}

export function MobileEmptyCard({
  icon,
  title,
  description,
  action,
  iconTone = "text-brand",
  descriptionClassName = "max-w-[310px] px-4",
}: MobileEmptyCardProps) {
  return (
    <section className="flex flex-col items-center rounded-xl bg-surface px-6 pt-7 pb-7 text-center">
      <span className={`grid size-18 place-items-center rounded-full bg-brand-subtle ${iconTone}`}>
        <Icon name={icon} size={30} />
      </span>
      <strong className="mt-3 font-heading text-title font-medium text-ink">{title}</strong>
      {description ? <p className={`mt-3 text-body-sm text-ink-secondary ${descriptionClassName}`}>{description}</p> : null}
      {action ? (
        <button
          type="button"
          className="mt-3 flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
          onClick={action.onClick}
        >
          {action.icon ? <Icon name={action.icon} size={18} /> : null}
          {action.label}
        </button>
      ) : null}
    </section>
  );
}

export interface MobileSegmentProps<T extends string> {
  items: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}

export function MobileSegment<T extends string>({ items, value, onChange, scroll = false }: MobileSegmentProps<T>) {
  return (
    <div
      className={`flex shrink-0 gap-2 ${scroll ? "-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""}`}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`flex h-11 items-center justify-center rounded-full border px-4 text-body-sm font-medium whitespace-nowrap transition-colors ${
            scroll ? "w-28.5 shrink-0" : "min-w-0 flex-1"
          } ${value === item.id ? "border-brand bg-brand text-on-action" : "border-line bg-surface text-ink hover:bg-subtle"}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

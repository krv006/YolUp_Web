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

export interface MobileEmptyCardProps {
  icon: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: ReactNode; icon?: string; onClick: () => void };
  iconTone?: string;
}

export function MobileEmptyCard({
  icon,
  title,
  description,
  action,
  iconTone = "text-brand",
}: MobileEmptyCardProps) {
  return (
    <section className="flex flex-col items-center rounded-xl bg-surface px-6 pt-7 pb-7 text-center">
      <span className={`grid size-18 place-items-center rounded-full bg-brand-subtle ${iconTone}`}>
        <Icon name={icon} size={30} />
      </span>
      <strong className="mt-3 font-heading text-title font-medium text-ink">{title}</strong>
      {description ? <p className="mt-3 px-4 text-body-sm text-ink-secondary">{description}</p> : null}
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
          className={`flex h-11 items-center justify-center rounded-full px-4 text-body-sm font-medium whitespace-nowrap transition-colors ${
            scroll ? "w-28.5 shrink-0" : "min-w-0 flex-1"
          } ${value === item.id ? "bg-brand text-on-action" : "bg-surface text-ink hover:bg-subtle"}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

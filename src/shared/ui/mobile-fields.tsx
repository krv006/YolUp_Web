import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

const INPUT_BASE =
  "h-13 w-full rounded-lg border-[1.5px] px-4 text-body text-ink outline-none transition-colors placeholder:text-ink-secondary focus:border-focus";

export const MOBILE_INPUT = `${INPUT_BASE} border-transparent bg-subtle`;

export const MOBILE_INPUT_SURFACE = `${INPUT_BASE} border-transparent bg-surface`;

export function MobileFieldLabel({
  label,
  aside,
  children,
}: {
  label: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{label}</span>
        {aside}
      </span>
      {children}
    </div>
  );
}

export interface MobilePickerFieldProps {
  type: "date" | "time" | "datetime-local" | "select";
  value: string;
  display: ReactNode;
  invalid?: boolean;
  surface?: boolean;
  min?: string;
  options?: Array<{ value: string; label: string }>;
  ariaLabel: string;
  onChange: (value: string) => void;
}

export function MobilePickerField({
  type,
  value,
  display,
  invalid = false,
  surface = false,
  min,
  options = [],
  ariaLabel,
  onChange,
}: MobilePickerFieldProps) {
  return (
    <span
      className={`relative flex h-13 w-full items-center gap-2 rounded-lg border-[1.5px] px-4 transition-colors focus-within:border-focus ${
        invalid ? "border-error-text" : "border-transparent"
      } ${surface ? "bg-surface" : "bg-subtle"}`}
    >
      <span className="min-w-0 flex-1 truncate text-body text-ink">{display}</span>
      <Icon
        name={invalid ? "warning" : "chevron-down"}
        size={20}
        className={`shrink-0 ${invalid ? "text-error-text" : "text-ink-secondary"}`}
      />
      {type === "select" ? (
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
          value={value}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="absolute inset-0 cursor-pointer opacity-0"
          value={value}
          min={min}
          aria-label={ariaLabel}
          onChange={(event) => event.target.value && onChange(event.target.value)}
        />
      )}
    </span>
  );
}

export function MobileChoiceChips<T extends string | number>({
  items,
  value,
  onChange,
  render,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render?: (item: T) => ReactNode;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <button
          key={String(item)}
          type="button"
          aria-pressed={item === value}
          className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
            item === value
              ? "bg-brand text-on-action"
              : "border border-line-strong bg-surface text-ink hover:bg-subtle"
          }`}
          onClick={() => onChange(item)}
        >
          {render ? render(item) : String(item)}
        </button>
      ))}
    </div>
  );
}

export function MobileToggle<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex h-13 w-fit items-center rounded-full bg-subtle p-1" role="radiogroup">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          className={`flex h-11 items-center rounded-full px-4 text-body-sm font-medium transition-colors ${
            value === item.id ? "bg-brand text-on-action" : "text-ink"
          }`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface ViewSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export interface ViewSelectProps<T extends string> {
  value: T;
  options: Array<ViewSelectOption<T>>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  align?: "start" | "end";
}

export function ViewSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
  align = "start",
}: ViewSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const SelectedIcon = selected?.icon;

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        {SelectedIcon ? <SelectedIcon size={17} className="shrink-0 text-ink-secondary" /> : null}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-ink-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+6px)] z-40 flex min-w-full flex-col gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => {
            const OptionIcon = option.icon;
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-label-strong whitespace-nowrap transition-colors ${
                    active ? "bg-action-subtle text-action" : "text-ink hover:bg-subtle"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {OptionIcon ? <OptionIcon size={17} className="shrink-0" /> : null}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? <Check size={16} className="shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export interface FilterChip<T extends string> {
  id: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  items: FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}

export function FilterChips<T extends string>({ items, value, onChange, compact = false }: FilterChipsProps<T>) {
  if (compact)
    return (
      <div
        className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={value === item.id}
            className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-body-sm font-medium whitespace-nowrap transition-colors ${
              value === item.id ? "border-brand bg-brand text-on-action" : "border-line bg-surface text-ink hover:bg-subtle"
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`flex h-[22px] shrink-0 items-center rounded-full px-2 text-caption-strong transition-colors ${
            value === item.id ? "bg-brand text-ink-inverse" : "bg-surface text-ink hover:bg-subtle"
          }`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

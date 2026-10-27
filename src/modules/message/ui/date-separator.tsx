import type { ReactNode } from "react";

export function DateSeparator({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 lg:my-2">
      <span className="hidden h-px flex-1 bg-line lg:block" />
      <span className="flex h-6 items-center rounded-full bg-surface px-3 text-caption text-ink-secondary lg:h-auto lg:bg-subtle lg:py-1 lg:text-caption-strong">
        {children}
      </span>
      <span className="hidden h-px flex-1 bg-line lg:block" />
    </div>
  );
}

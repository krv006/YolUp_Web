import type { ReactNode } from "react";

export function DateSeparator({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="rounded-full bg-subtle px-3 py-1 text-caption-strong text-ink-secondary">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

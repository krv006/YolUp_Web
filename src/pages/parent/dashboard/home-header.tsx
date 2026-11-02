import type { ReactNode } from "react";
import { ParentBell } from "@/widgets/parent-shell";

export function HomeHeader({ eyebrow, title }: { eyebrow: ReactNode; title: ReactNode }) {
  return (
    <header className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <small className="truncate text-body-xs text-ink-secondary">{eyebrow}</small>
        <h1 className="truncate font-heading text-[26px]/9 font-semibold text-ink">{title}</h1>
      </div>
      <ParentBell />
    </header>
  );
}

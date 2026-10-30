import type { ReactNode } from "react";

export function MobileActionBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex shrink-0 gap-3 rounded-t-2xl bg-surface px-4 pt-3 pb-8.5 shadow-nav-top ${className}`}>
      {children}
    </div>
  );
}

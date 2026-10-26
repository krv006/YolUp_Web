import type { ReactNode } from "react";

export type RouteStatusTone = "error" | "info" | "warning";

const BADGE: Record<RouteStatusTone, string> = {
  error: "bg-danger-bg text-danger",
  info: "bg-brand-subtle text-brand",
  warning: "bg-warning-bg text-warning-fg",
};

export interface RouteStatusProps {
  tone?: RouteStatusTone;
  /** Katta raqam (404 kabi) — kartaning tepasida chiqadi. */
  eyebrow?: string;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Full-page state for 404, 403 and unexpected errors. */
export function RouteStatus({
  tone = "info",
  eyebrow,
  icon,
  title,
  description,
  action,
}: RouteStatusProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas bg-page-gradient px-4 py-10">
      <div className="flex w-full max-w-130 flex-col items-center gap-4 rounded-xl bg-surface px-10 py-12 text-center">
        {eyebrow ? (
          <strong className="font-heading text-5xl text-brand">{eyebrow}</strong>
        ) : null}

        <span className={`grid size-16 place-items-center rounded-md ${BADGE[tone]}`}>{icon}</span>

        <h1 className="font-heading text-h1 text-ink">{title}</h1>

        <p className="max-w-100 text-body-sm text-ink-secondary">{description}</p>

        {action ? <div className="mt-2 flex items-center justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

export const routeStatusButton =
  "flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong";

export const routeStatusGhostButton =
  "flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle";

import type { ReactNode } from "react";

export type RouteStatusTone = "error" | "info" | "warning";

const EYEBROW: Record<RouteStatusTone, string> = {
  error: "text-error",
  info: "text-action",
  warning: "text-saffron-strong",
};

const BADGE: Record<RouteStatusTone, string> = {
  error: "bg-error-bg text-error-text",
  info: "bg-action-subtle text-action",
  warning: "bg-saffron-subtle text-saffron-strong",
};

export interface RouteStatusProps {
  tone?: RouteStatusTone;
  eyebrow: string;
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-canvas px-4 py-10">
      <strong className={`font-heading text-display ${EYEBROW[tone]}`}>{eyebrow}</strong>

      <div className="flex w-full max-w-[520px] flex-col items-center gap-3 rounded-2xl bg-subtle px-6 py-10 text-center">
        <span className={`grid size-16 place-items-center rounded-full ${BADGE[tone]}`}>{icon}</span>
        <h1 className="font-heading text-h3 text-ink">{title}</h1>
        <p className="max-w-[380px] text-body-sm text-ink-secondary">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export const routeStatusButton =
  "flex h-12 items-center gap-2 rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover";

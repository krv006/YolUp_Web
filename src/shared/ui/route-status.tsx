import type { ReactNode } from "react";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MobileActionBar } from "@/shared/ui/mobile-action-bar";

export type RouteStatusTone = "error" | "info" | "warning";

const BADGE: Record<RouteStatusTone, string> = {
  error: "bg-danger-bg text-danger",
  info: "bg-brand-subtle text-brand",
  warning: "bg-warning-bg text-warning-fg",
};

const CIRCLE: Record<RouteStatusTone, string> = {
  error: "bg-danger-bg text-error-text",
  info: "bg-brand-subtle text-brand",
  warning: "bg-accent-saffron-bg text-saffron-strong",
};

export interface RouteStatusProps {
  tone?: RouteStatusTone;
  /** Katta raqam (404 kabi) — kartaning tepasida chiqadi. */
  eyebrow?: string;
  icon: ReactNode;
  mobileIcon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Full-page state for 404, 403 and unexpected errors. */
export function RouteStatus({
  tone = "info",
  eyebrow,
  icon,
  mobileIcon,
  title,
  description,
  action,
}: RouteStatusProps) {
  const isCompact = useIsCompact();

  if (isCompact)
    return (
      <div className="flex h-full w-full flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-10 pt-[190px] pb-6 text-center">
          <span className={`grid size-30 shrink-0 place-items-center rounded-full ${CIRCLE[tone]}`}>
            {eyebrow ? (
              <strong className="font-heading text-[36px] leading-none font-bold">{eyebrow}</strong>
            ) : (
              (mobileIcon ?? icon)
            )}
          </span>
          <h1 className="mt-[14px] font-heading text-[22px] leading-[30px] font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-3.5 text-body-sm text-ink-secondary">{description}</p>
        </div>
        {action ? <MobileActionBar>{action}</MobileActionBar> : null}
      </div>
    );

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
  "flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong max-lg:h-13 max-lg:min-w-0 max-lg:flex-1 max-lg:justify-center max-lg:px-3 max-lg:text-title max-lg:font-semibold max-lg:whitespace-nowrap";

export const routeStatusGhostButton =
  "flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle max-lg:h-13 max-lg:min-w-0 max-lg:flex-1 max-lg:justify-center max-lg:border-line-strong max-lg:px-3 max-lg:text-title max-lg:font-semibold max-lg:whitespace-nowrap";

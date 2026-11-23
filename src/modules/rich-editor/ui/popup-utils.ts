import type { PopupPosition } from "./popup";

/** Anchor elementdan pastga qarab joylashuv. */
export function below(anchor: HTMLElement | null): PopupPosition {
  const rect = anchor?.getBoundingClientRect();
  return { top: (rect?.bottom ?? 0) + 6, left: rect?.left ?? 8 };
}

export const barButton =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-body-xs text-ink-secondary transition-colors hover:bg-subtle hover:text-ink";
export const barButtonActive = "bg-brand-subtle text-brand";

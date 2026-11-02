import type { HomeworkState } from "@/modules/parent";

export const STATE_TILE: Record<HomeworkState, { icon: string; tone: string }> = {
  pending: { icon: "assignment", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  overdue: { icon: "assignment", tone: "bg-danger-bg text-error-text" },
  resubmit: { icon: "refresh", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  checking: { icon: "assignment", tone: "bg-accent-teal-bg text-accent-teal-fg" },
  error: { icon: "auto-awesome", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  graded: { icon: "check-circle", tone: "bg-accent-green-bg text-accent-green-fg" },
  done: { icon: "check-circle", tone: "bg-accent-green-bg text-accent-green-fg" },
};

export const STATE_CHIP: Record<HomeworkState, { icon: string | null; tone: string }> = {
  pending: { icon: "hourglass-empty", tone: "bg-warning-bg text-warning-text" },
  overdue: { icon: "warning-fill", tone: "bg-danger-bg text-error-text" },
  resubmit: { icon: "refresh", tone: "bg-warning-bg text-warning-text" },
  checking: { icon: "pending", tone: "bg-accent-teal-bg text-accent-teal-fg" },
  error: { icon: "warning-fill", tone: "bg-danger-bg text-error-text" },
  graded: { icon: null, tone: "bg-success-bg text-success-text" },
  done: { icon: "check-circle", tone: "bg-success-bg text-success-text" },
};

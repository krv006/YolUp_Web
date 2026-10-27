import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { MessageAssignment } from "@/shared/types";
import { AssignmentDetailDialog } from "./assignment-detail-dialog";

export interface HomeworkMessageCardProps {
  assignment: MessageAssignment;
  canReview?: boolean;
}

export function HomeworkMessageCard({ assignment, canReview = false }: HomeworkMessageCardProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const left = due ? Math.ceil((due.getTime() - now) / (24 * 60 * 60 * 1000)) : null;
  const dueLabel =
    due && !Number.isNaN(due.getTime())
      ? `${due.getDate()}-${(months[due.getMonth()] ?? "").toLowerCase()}, ${String(
          due.getHours()
        ).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`
      : "—";

  const progress = assignment.totalCount
    ? Math.min(100, Math.round((assignment.submittedCount / assignment.totalCount) * 100))
    : 0;

  return (
    <>
      <article className="mx-auto flex w-full max-w-75 flex-col gap-3 rounded-xl bg-surface p-4 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-saffron-bg text-accent-saffron-fg">
            <Icon name="assign" size={22} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <small className="text-caption text-ink-secondary uppercase">{t("chatCard.label")}</small>
            <strong className="truncate text-title text-ink">{assignment.title}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {left !== null ? (
            <span
              className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption-strong ${
                left < 0 ? "bg-error-bg text-error-text" : "bg-accent-teal-bg text-accent-teal-fg"
              }`}
            >
              <Icon name="clock" size={14} />
              {left < 0 ? t("chatCard.overdue") : t("chatCard.daysLeft", { count: left })}
            </span>
          ) : null}
          {assignment.totalCount ? (
            <small className="ml-auto shrink-0 text-body-xs text-ink-secondary">
              {t("messageCard.submitted", {
                done: assignment.submittedCount,
                total: assignment.totalCount,
              })}
            </small>
          ) : null}
        </div>

        <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
          <span className="block h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </span>

        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-full bg-brand-subtle px-4 text-button text-brand transition-colors hover:bg-tint"
          onClick={() => setOpen(true)}
        >
          {canReview ? t("messageCard.review") : t("chatCard.submit")}
        </button>
      </article>

      <article className="hidden w-full max-w-[520px] flex-col gap-3 rounded-2xl border border-line bg-surface p-4 lg:flex">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action-subtle text-action">
            <Icon name="assign" size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <small className="text-caption text-ink-tertiary">{t("chatCard.label")}</small>
            <strong className="truncate text-label-strong text-ink">{assignment.title}</strong>
          </span>
          {left !== null ? (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-caption-strong ${
                left < 0
                  ? "bg-error-bg text-error-text"
                  : left <= 1
                    ? "bg-saffron-subtle text-saffron-strong"
                    : "bg-action-subtle text-action"
              }`}
            >
              {left < 0 ? t("chatCard.overdue") : t("chatCard.daysLeft", { count: left })}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-ink-tertiary">
          <span className="flex items-center gap-1.5">
            <Icon name="clock" size={15} /> {dueLabel}
          </span>
          {assignment.totalCount ? (
            <span className="flex items-center gap-1.5">
              <Icon name="groups" size={15} />
              {t("messageCard.submitted", {
                done: assignment.submittedCount,
                total: assignment.totalCount,
              })}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => setOpen(true)}
        >
          {canReview ? t("messageCard.review") : t("chatCard.submit")}
        </button>
      </article>

      <AssignmentDetailDialog assignmentId={assignment.id} open={open} onOpenChange={setOpen} />
    </>
  );
}

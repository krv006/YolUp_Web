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

  return (
    <>
      <article className="flex w-full max-w-[520px] flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
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

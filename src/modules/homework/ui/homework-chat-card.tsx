import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { Assignment } from "@/shared/types";
import { AssignmentDetailDialog } from "./assignment-detail-dialog";

export interface HomeworkChatCardProps {
  assignment: Assignment;
}

export function HomeworkChatCard({ assignment }: HomeworkChatCardProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const submission = assignment.mySubmission;

  function formatDate(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  function daysLeft(): number | null {
    if (!assignment.dueAt) return null;
    const diff = new Date(assignment.dueAt).getTime() - now;
    if (Number.isNaN(diff)) return null;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  const left = daysLeft();

  return (
    <>
      <article className="flex w-full max-w-[520px] flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action-subtle text-action">
            <Icon name="assign" size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <small className="text-caption text-ink-tertiary">{t("chatCard.label")}</small>
            <strong className="truncate text-label-strong text-ink">
              {assignment.courseTitle}
            </strong>
          </span>
          {submission ? (
            <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
              {t("chatCard.submitted")}
            </span>
          ) : left !== null ? (
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

        <h4 className="font-heading text-title text-ink">{assignment.title}</h4>
        {assignment.description ? (
          <p className="line-clamp-3 text-body-sm text-ink-secondary">{assignment.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-ink-tertiary">
          <span className="flex items-center gap-1.5">
            <Icon name="clock" size={15} /> {formatDate(assignment.dueAt)}
          </span>
          {assignment.hasAttachment ? (
            <span className="flex items-center gap-1.5">
              <Icon name="assign" size={15} /> {t("chatCard.fileCount", { count: 1 })}
            </span>
          ) : null}
          {assignment.lessonTitle ? (
            <span className="flex items-center gap-1.5 text-action">
              <Icon name="nav-calendar" size={15} /> {assignment.lessonTitle}
            </span>
          ) : null}
        </div>

        {submission ? (
          <span className="flex items-center justify-center gap-2 rounded-xl bg-success-bg px-4 py-3 text-label-strong text-success-text">
            <Icon name="check-circle" size={18} />
            {t("chatCard.submittedAt", { value: formatDate(submission.createdAt) })}
          </span>
        ) : (
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => setOpen(true)}
          >
            {t("chatCard.submit")}
          </button>
        )}
      </article>

      <AssignmentDetailDialog assignmentId={assignment.id} open={open} onOpenChange={setOpen} />
    </>
  );
}

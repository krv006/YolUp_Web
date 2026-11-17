import { useTranslation } from "react-i18next";
import type { Assignment, Submission } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { shortDateTime } from "../lib/format";

type StepState = "done" | "active" | "waiting";

const DOT: Record<StepState, string> = {
  done: "bg-success text-ink-inverse",
  active: "bg-accent-violet-fg text-ink-inverse",
  waiting: "bg-subtle text-ink-secondary",
};

const ICON: Record<StepState, string> = { done: "check", active: "auto-awesome", waiting: "schedule" };

export interface HomeworkSubmittedDialogProps {
  open: boolean;
  assignment: Assignment;
  submission: Submission | null;
  onDone: () => void;
}

export function HomeworkSubmittedDialog({ open, assignment, submission, onDone }: HomeworkSubmittedDialogProps) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const sentHint = submission
    ? [
        shortDateTime(submission.createdAt, months),
        submission.isLate ? t("workspace.hwItem.late") : t("workspace.hwItem.onTime"),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const steps = [
    { id: "sent", state: "done" as StepState, title: t("workspace.hwItem.doneSent"), hint: sentHint },
    assignment.aiCheck
      ? { id: "ai", state: "active" as StepState, title: t("workspace.hwItem.doneAi"), hint: t("workspace.hwItem.doneAiHint") }
      : null,
    {
      id: "teacher",
      state: (assignment.aiCheck ? "waiting" : "active") as StepState,
      title: assignment.grading === "none" ? t("workspace.hwItem.doneReview") : t("workspace.hwItem.doneTeacher"),
      hint: assignment.grading === "none" ? t("workspace.hwItem.doneReviewHint") : t("workspace.hwItem.doneTeacherHint"),
    },
  ].filter((step) => step !== null);

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => !next && onDone()}
      variant="confirm"
      layout="centered"
      width="lg:w-100"
      icon={
        <span className="grid size-14 place-items-center rounded-full bg-success-bg text-success-fg">
          <Icon name="check-circle" size={28} />
        </span>
      }
      title={t("workspace.hwItem.doneTitle")}
      description={t("workspace.hwItem.doneText", { title: assignment.title })}
      footer={
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
          onClick={onDone}
        >
          {t("workspace.hwItem.doneBack")}
        </button>
      }
    >
      <ol className="flex flex-col gap-3 rounded-2xl bg-subtle/60 p-4 text-left">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${DOT[step.state]}`}>
              <Icon name={ICON[step.state]} size={16} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className={`text-body-sm font-semibold ${step.state === "waiting" ? "text-ink-secondary" : "text-ink"}`}>
                {step.title}
              </strong>
              {step.hint ? <small className="text-caption text-ink-secondary">{step.hint}</small> : null}
            </span>
          </li>
        ))}
      </ol>
    </AppDialog>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStudentProgress, type AssignmentState, type StudentProgress } from "@/modules/progress";
import { Dialog, DialogContent } from "@/shared/ui/legacy";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";

type DetailTab = "lessons" | "assignments" | "payments";

interface StudentProgressDialogProps {
  courseId: string | null;
  student: StudentProgress | null;
  monthlyFee: number | null;
  onOpenChange: (open: boolean) => void;
}

const STATE_TONE: Record<AssignmentState, string> = {
  done: "text-success",
  awaiting_review: "text-brand",
  resubmit: "text-danger",
  missed: "text-danger",
  not_submitted: "text-ink-secondary",
};

export function StudentProgressDialog({ courseId, student, monthlyFee, onOpenChange }: StudentProgressDialogProps) {
  const { t, i18n } = useTranslation("group");
  const [tab, setTab] = useState<DetailTab>("lessons");
  const detail = useStudentProgress(courseId, student?.id ?? null);
  const date = (value: string) => formatProgressDate(value, i18n.language);
  const month = (value: string) => formatProgressMonth(value, i18n.language);
  const money = (value: number) => formatProgressMoney(value, i18n.language);

  const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: "lessons", label: t("progress.detail.lessons") },
    { id: "assignments", label: t("progress.detail.assignments") },
    { id: "payments", label: t("progress.detail.payments") },
  ];
  const data = detail.data;

  return (
    <Dialog open={student !== null} onOpenChange={onOpenChange}>
      {student ? (
        <DialogContent
          title={student.name}
          description={t("progress.joined", { date: date(student.joinedAt) })}
          className="student-progress-dialog"
        >
          <div className="mt-3 grid grid-cols-3 gap-2" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`flex h-10 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
                  tab === item.id ? "bg-brand text-on-action" : "bg-surface text-ink"
                }`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-[52vh] overflow-y-auto">
            {detail.isLoading ? (
              <ul className="flex flex-col overflow-hidden rounded-xl bg-surface" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <li key={index} className="flex h-14 items-center border-b border-line px-4 last:border-b-0">
                    <RowSkeleton />
                  </li>
                ))}
              </ul>
            ) : detail.isError || !data ? (
              <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.errorDescription")}</p>
            ) : tab === "lessons" ? (
              data.lessons.length ? (
                <ul className="flex flex-col overflow-hidden rounded-xl bg-surface">
                  {data.lessons.map((lesson) => (
                    <li key={lesson.lessonId} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-title-sm text-ink">{lesson.title}</strong>
                        <small className="text-body-xs text-ink-secondary">
                          {date(lesson.startsAt)}
                          {lesson.minutes !== null ? ` · ${t("progress.detail.minutes", { count: lesson.minutes })}` : ""}
                        </small>
                        {lesson.lateReason || lesson.teacherNote ? (
                          <small className="truncate text-caption text-ink-secondary">
                            {[lesson.lateReason, lesson.teacherNote].filter(Boolean).join(" · ")}
                          </small>
                        ) : null}
                      </span>
                      <strong className={`shrink-0 text-title-sm ${lesson.attended ? "text-success" : "text-danger"}`}>
                        {lesson.attended ? t("progress.detail.attended") : t("progress.detail.absent")}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.detail.noLessons")}</p>
              )
            ) : tab === "assignments" ? (
              data.assignments.length ? (
                <ul className="flex flex-col overflow-hidden rounded-xl bg-surface">
                  {data.assignments.map((assignment) => (
                    <li key={assignment.assignmentId} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-title-sm text-ink">{assignment.title}</strong>
                        <small className="text-body-xs text-ink-secondary">
                          {assignment.dueAt
                            ? t("progress.detail.due", { date: date(assignment.dueAt) })
                            : t("progress.detail.noDeadline")}
                        </small>
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <strong className={`text-title-sm ${STATE_TONE[assignment.state]}`}>
                          {t(`progress.detail.state.${assignment.state}`)}
                        </strong>
                        {assignment.score !== null ? (
                          <small className="font-numeric text-caption text-ink-secondary">
                            {t("progress.detail.score", { value: assignment.score })}
                          </small>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.detail.noAssignments")}</p>
              )
            ) : (
              <ul className="flex flex-col overflow-hidden rounded-xl bg-surface">
                {data.payments.map((payment) => (
                  <li key={payment.period} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-sm text-ink capitalize">{month(payment.period)}</strong>
                      <small className="text-body-xs text-ink-secondary">
                        {payment.status === "paid" && payment.paidAt
                          ? `${t("progress.detail.paidOn", { date: date(payment.paidAt) })}${payment.note ? ` · ${payment.note}` : ""}`
                          : monthlyFee
                            ? t("progress.fee", { amount: money(monthlyFee) })
                            : ""}
                      </small>
                    </span>
                    <strong className={`shrink-0 text-title-sm ${payment.status === "paid" ? "text-success" : "text-danger"}`}>
                      {payment.status === "paid"
                        ? payment.amount !== null
                          ? money(payment.amount)
                          : t("progress.paid")
                        : t("progress.unpaid")}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

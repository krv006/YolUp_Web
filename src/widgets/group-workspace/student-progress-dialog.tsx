import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import {
  useStudentProgress,
  useUnmarkPaid,
  type AssignmentState,
  type Payment,
  type ProgressRange,
  type StudentProgress,
} from "@/modules/progress";
import { AppDialog } from "@/shared/ui/app-dialog";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { PaymentDialog, type PaymentTarget } from "./payment-dialog";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";

type DetailTab = "lessons" | "assignments" | "payments";

interface StudentProgressDialogProps {
  courseId: string | null;
  student: StudentProgress | null;
  monthlyFee: number | null;
  range: ProgressRange;
  onOpenChange: (open: boolean) => void;
}

const STATE_TONE: Record<AssignmentState, string> = {
  done: "text-success",
  awaiting_review: "text-brand",
  resubmit: "text-danger",
  missed: "text-danger",
  not_submitted: "text-ink-secondary",
};

export function StudentProgressDialog({ courseId, student, monthlyFee, range, onOpenChange }: StudentProgressDialogProps) {
  const { t, i18n } = useTranslation("group");
  const navigate = useNavigate();
  const [tab, setTab] = useState<DetailTab>("lessons");
  const detail = useStudentProgress(courseId, student?.id ?? null, range);
  const unmarkPaid = useUnmarkPaid();
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const [unmarking, setUnmarking] = useState<Payment | null>(null);
  const date = (value: string) => formatProgressDate(value, i18n.language);
  const month = (value: string) => formatProgressMonth(value, i18n.language);
  const money = (value: number) => formatProgressMoney(value, i18n.language);

  const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: "lessons", label: t("progress.detail.lessons") },
    { id: "assignments", label: t("progress.detail.assignments") },
    ...(monthlyFee ? [{ id: "payments" as const, label: t("progress.detail.payments") }] : []),
  ];
  const activeTab = TABS.some((item) => item.id === tab) ? tab : "lessons";
  const data = detail.data;

  return (
    <AppDialog
      open={student !== null}
      onOpenChange={onOpenChange}
      variant="panel"
      width="lg:w-115"
      title={student?.name ?? ""}
      description={student ? t("progress.joined", { date: date(student.joinedAt) }) : undefined}
    >
      {student ? (
        <>
          <div className={`grid shrink-0 gap-2 ${TABS.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                className={`flex h-10 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
                  activeTab === item.id ? "bg-brand text-on-action" : "bg-subtle text-ink"
                }`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pb-2">
            {detail.isLoading ? (
              <ul className="flex flex-col overflow-hidden rounded-xl border border-line" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <li key={index} className="flex h-14 items-center border-b border-line px-4 last:border-b-0">
                    <RowSkeleton />
                  </li>
                ))}
              </ul>
            ) : detail.isError || !data ? (
              <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.errorDescription")}</p>
            ) : activeTab === "lessons" ? (
              data.lessons.length ? (
                <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
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
            ) : activeTab === "assignments" ? (
              data.assignments.length ? (
                <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
                  {data.assignments.map((assignment) => (
                    <li key={assignment.assignmentId} className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                        onClick={() =>
                          navigate(
                            assignment.submissionId
                              ? `${ROUTES.teacher.homeworkReview(assignment.assignmentId)}?s=${encodeURIComponent(assignment.submissionId)}`
                              : ROUTES.teacher.homeworkReview(assignment.assignmentId)
                          )
                        }
                      >
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
                        <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.detail.noAssignments")}</p>
              )
            ) : (
              <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
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
                    {payment.status === "paid" ? (
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={t("progress.payment.edit")}
                          className="grid size-9 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:bg-muted"
                          onClick={() => setPaying({ studentId: student.id, name: student.name, month: payment.period, payment })}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={t("progress.undoPaid")}
                          className="grid size-9 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:bg-danger-bg hover:text-danger"
                          onClick={() => setUnmarking(payment)}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-body-xs font-medium text-on-action transition-colors hover:bg-brand-strong"
                        onClick={() => setPaying({ studentId: student.id, name: student.name, month: payment.period, payment: null })}
                      >
                        <Icon name="check-circle" size={14} />
                        {t("progress.payment.markShort")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <PaymentDialog courseId={courseId} target={paying} monthlyFee={monthlyFee} onClose={() => setPaying(null)} />
          <ConfirmDialog
            open={unmarking !== null}
            onOpenChange={(open) => !open && setUnmarking(null)}
            icon="check-circle"
            title={t("progress.unmarkTitle")}
            description={t("progress.unmarkDescription", { name: student?.name ?? "", month: unmarking ? month(unmarking.period) : "" })}
            confirmLabel={t("progress.unmarkConfirm")}
            cancelLabel={t("progress.cancel")}
            pending={unmarkPaid.isPending}
            onConfirm={() => {
              if (!courseId || !student || !unmarking) return;
              unmarkPaid.mutate(
                { courseId, studentId: student.id, month: unmarking.period },
                {
                  onSuccess: () => {
                    toast.success(t("progress.unmarked", { name: student.name }));
                    setUnmarking(null);
                  },
                  onError: (error) => toast.error(describeCreateError(error)),
                }
              );
            }}
          />
        </>
      ) : null}
    </AppDialog>
  );
}

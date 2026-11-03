import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import {
  shiftMonth,
  useCourseProgress,
  useMarkPaid,
  useUnmarkPaid,
  type StudentProgress,
} from "@/modules/progress";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { Avatar } from "@/shared/ui/legacy";
import { PanelHeading } from "./panel-heading";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";
import { StudentProgressDialog } from "./student-progress-dialog";

type PaymentFilter = "all" | "unpaid" | "paid";

interface ProgressPanelProps {
  courseId: string | null;
}

export function ProgressPanel({ courseId }: ProgressPanelProps) {
  const { t, i18n } = useTranslation("group");
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [openStudent, setOpenStudent] = useState<StudentProgress | null>(null);
  const [unmarkTarget, setUnmarkTarget] = useState<StudentProgress | null>(null);
  const progress = useCourseProgress(courseId, month);
  const markPaid = useMarkPaid();
  const unmarkPaid = useUnmarkPaid();

  const data = progress.data;
  const shownMonth = data?.month ?? month;
  const students = useMemo(
    () => (data?.students ?? []).filter((item) => filter === "all" || item.payment.status === filter),
    [data, filter]
  );

  const monthLabel = shownMonth ? formatProgressMonth(shownMonth, i18n.language) : "";
  const formatDate = (value: string) => formatProgressDate(value, i18n.language);
  const formatMoney = (value: number) => formatProgressMoney(value, i18n.language);

  function mark(student: StudentProgress) {
    if (!courseId || !shownMonth) return;
    markPaid.mutate(
      { courseId, studentId: student.id, month: shownMonth },
      {
        onSuccess: () => toast.success(t("progress.markedPaid", { name: student.name })),
        onError: (error) => toast.error(describeCreateError(error)),
      }
    );
  }

  function confirmUnmark() {
    if (!courseId || !shownMonth || !unmarkTarget) return;
    unmarkPaid.mutate(
      { courseId, studentId: unmarkTarget.id, month: shownMonth },
      {
        onSuccess: () => {
          toast.success(t("progress.unmarked", { name: unmarkTarget.name }));
          setUnmarkTarget(null);
        },
        onError: (error) => toast.error(describeCreateError(error)),
      }
    );
  }

  const FILTERS: Array<{ id: PaymentFilter; label: string }> = [
    { id: "all", label: t("progress.filterAll") },
    { id: "unpaid", label: t("progress.filterUnpaid") },
    { id: "paid", label: t("progress.filterPaid") },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5">
      <PanelHeading
        eyebrow={t("progress.eyebrow")}
        title={t("progress.title")}
        subtitle={data?.monthlyFee ? t("progress.fee", { amount: formatMoney(data.monthlyFee) }) : undefined}
        className="mb-1 shrink-0"
      />

      <div className="flex h-11 shrink-0 items-center justify-between rounded-full bg-surface px-2">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle"
          aria-label={t("progress.prevMonth")}
          disabled={!shownMonth}
          onClick={() => shownMonth && setMonth(shiftMonth(shownMonth, -1))}
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <strong className="text-body-sm font-medium text-ink capitalize">{monthLabel}</strong>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle"
          aria-label={t("progress.nextMonth")}
          disabled={!shownMonth}
          onClick={() => shownMonth && setMonth(shiftMonth(shownMonth, 1))}
        >
          <Icon name="chevron-right" size={20} />
        </button>
      </div>

      {progress.isLoading ? (
        <ul className="flex flex-col overflow-hidden rounded-xl bg-surface" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex h-[74px] items-center border-b border-line px-4 last:border-b-0">
              <RowSkeleton />
            </li>
          ))}
        </ul>
      ) : progress.isError ? (
        <MobileEmptyCard
          icon="bar-chart"
          title={t("progress.errorTitle")}
          description={t("progress.errorDescription")}
          action={{ label: t("progress.retry"), icon: "refresh", onClick: () => progress.refetch() }}
        />
      ) : data && data.students.length ? (
        <>
          <section className="flex shrink-0 flex-col gap-3 rounded-xl bg-brand p-4 text-on-action">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: `${data.summary.paid}/${data.summary.students}`, label: t("progress.statPaid") },
                {
                  value: data.summary.attendancePercent === null ? "—" : `${data.summary.attendancePercent}%`,
                  label: t("progress.statAttendance"),
                },
                {
                  value:
                    data.summary.homeworkCompletionPercent === null
                      ? "—"
                      : `${data.summary.homeworkCompletionPercent}%`,
                  label: t("progress.statHomework"),
                },
              ].map((tile) => (
                <span key={tile.label} className="flex h-16 flex-col justify-center rounded-xl bg-on-brand-subtle px-3">
                  <strong className="text-title-lg leading-6">{tile.value}</strong>
                  <small className="text-caption">{tile.label}</small>
                </span>
              ))}
            </div>
          </section>

          <div className="grid shrink-0 grid-cols-3 gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
                  filter === item.id ? "bg-brand text-on-action" : "bg-surface text-ink"
                }`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {students.length ? (
            <ul className="flex shrink-0 flex-col overflow-hidden rounded-xl bg-surface">
              {students.map((student) => {
                const paid = student.payment.status === "paid";
                const { homework, attendance } = student;
                return (
                  <li key={student.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setOpenStudent(student)}
                    >
                      <Avatar name={student.name} size="sm" className="[&_.avatar]:size-11" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <strong className="truncate text-title text-ink">{student.name}</strong>
                        <small className="truncate text-body-xs text-ink-secondary">
                          {t("progress.joined", { date: formatDate(student.joinedAt) })}
                        </small>
                        <small className="truncate font-numeric text-caption text-ink-secondary">
                          {t("progress.rowStats", {
                            attendance: attendance.percent === null ? "—" : `${attendance.percent}%`,
                            submitted: homework.submitted,
                            total: homework.total,
                          })}
                          {homework.average !== null ? ` · ${t("progress.average", { value: homework.average })}` : ""}
                        </small>
                        {homework.missed > 0 || (!paid && student.payment.unpaidMonths > 1) ? (
                          <small className="text-caption text-danger">
                            {[
                              homework.missed > 0 ? t("progress.missed", { count: homework.missed }) : null,
                              !paid && student.payment.unpaidMonths > 1
                                ? t("progress.unpaidMonths", { count: student.payment.unpaidMonths })
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        ) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={markPaid.isPending || unmarkPaid.isPending}
                      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-caption-strong transition-colors disabled:opacity-60 ${
                        paid ? "bg-brand-subtle text-brand" : "bg-danger-bg text-danger"
                      }`}
                      aria-label={paid ? t("progress.undoPaid") : t("progress.markPaid")}
                      onClick={() => (paid ? setUnmarkTarget(student) : mark(student))}
                    >
                      <Icon name={paid ? "check-circle" : "add"} size={16} />
                      {paid ? t("progress.paid") : t("progress.markPaidShort")}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-body-sm text-ink-secondary">{t("progress.filterEmpty")}</p>
          )}
        </>
      ) : (
        <MobileEmptyCard
          icon="bar-chart"
          title={t("progress.emptyTitle")}
          description={t("progress.emptyDescription")}
        />
      )}

      <StudentProgressDialog
        courseId={courseId}
        student={openStudent}
        monthlyFee={data?.monthlyFee ?? null}
        onOpenChange={(open) => !open && setOpenStudent(null)}
      />

      <ConfirmDialog
        open={unmarkTarget !== null}
        onOpenChange={(open) => !open && setUnmarkTarget(null)}
        icon="check-circle"
        title={t("progress.unmarkTitle")}
        description={t("progress.unmarkDescription", { name: unmarkTarget?.name ?? "", month: monthLabel })}
        confirmLabel={t("progress.unmarkConfirm")}
        cancelLabel={t("progress.cancel")}
        pending={unmarkPaid.isPending}
        onConfirm={confirmUnmark}
      />
    </div>
  );
}

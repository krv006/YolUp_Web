import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import {
  monthKey,
  paymentMonthBounds,
  shiftMonth,
  useCourseProgress,
  useUnmarkPaid,
  type ProgressRange,
  type StudentProgress,
} from "@/modules/progress";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { Avatar } from "@/shared/ui/legacy";
import { PanelHeading } from "./panel-heading";
import { PaymentDialog, type PaymentTarget } from "./payment-dialog";
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
  const [range, setRange] = useState<ProgressRange>("all");
  const [openStudent, setOpenStudent] = useState<StudentProgress | null>(null);
  const [unmarkTarget, setUnmarkTarget] = useState<StudentProgress | null>(null);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const progress = useCourseProgress(courseId, month, range);
  const unmarkPaid = useUnmarkPaid();

  const data = progress.data;
  const shownMonth = data?.month ?? month;
  const withPayments = !data || Boolean(data.monthlyFee);
  const [now] = useState(() => new Date());
  const bounds = useMemo(() => paymentMonthBounds((data?.students ?? []).map((item) => item.joinedAt), now), [data, now]);
  const students = useMemo(
    () =>
      (data?.students ?? []).filter(
        (item) =>
          !withPayments ||
          filter === "all" ||
          (item.payment.status === filter && !(shownMonth && shownMonth < monthKey(new Date(item.joinedAt))))
      ),
    [data, filter, withPayments, shownMonth]
  );

  const monthLabel = shownMonth ? formatProgressMonth(shownMonth, i18n.language) : "";
  const formatDate = (value: string) => formatProgressDate(value, i18n.language);
  const formatMoney = (value: number) => formatProgressMoney(value, i18n.language);

  function openPayment(student: StudentProgress) {
    if (!shownMonth) return;
    setPaying({
      studentId: student.id,
      name: student.name,
      month: shownMonth,
      payment: student.payment.status === "paid" ? student.payment : null,
    });
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

  const RANGES: Array<{ id: ProgressRange; label: string }> = [
    { id: "all", label: t("attendance.filterAllShort") },
    { id: "30d", label: t("attendance.filterMonthShort") },
    { id: "month", label: t("attendance.filterCurrent") },
  ];

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
        subtitle={
          data?.monthlyFee
            ? t("progress.fee", { amount: formatMoney(data.monthlyFee) })
            : data
              ? t("progress.noFee")
              : undefined
        }
        className="mb-1 shrink-0"
      />

      {withPayments ? (
        <div className="flex h-11 shrink-0 items-center justify-between rounded-full bg-surface px-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={t("progress.prevMonth")}
            disabled={!shownMonth || shownMonth <= bounds.min}
            onClick={() => shownMonth && setMonth(shiftMonth(shownMonth, -1))}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          {shownMonth && shownMonth !== bounds.current ? (
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-body-sm font-medium text-ink capitalize transition-colors hover:bg-subtle"
              title={t("progress.currentMonth")}
              onClick={() => setMonth(bounds.current)}
            >
              {monthLabel}
              <Icon name="today" size={16} className="text-icon-tertiary" />
            </button>
          ) : (
            <strong className="text-body-sm font-medium text-ink capitalize">{monthLabel}</strong>
          )}
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={t("progress.nextMonth")}
            disabled={!shownMonth || shownMonth >= bounds.max}
            onClick={() => shownMonth && setMonth(shiftMonth(shownMonth, 1))}
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>
      ) : null}

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
            <div className="flex items-center gap-3">
              <small className="shrink-0 text-caption-strong">{t("progress.rangeLabel")}</small>
              <div className="flex min-w-0 flex-1 gap-1 rounded-full bg-on-brand-subtle p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={range === item.id}
                    className={`flex h-8 min-w-0 flex-1 items-center justify-center truncate rounded-full px-2 text-caption-strong transition-colors ${
                      range === item.id ? "bg-surface text-brand" : "text-on-action"
                    }`}
                    onClick={() => setRange(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                withPayments
                  ? { value: `${data.summary.paid}/${data.summary.students}`, label: t("progress.statPaid") }
                  : { value: String(data.lessonCount), label: t("progress.statLessons") },
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

          {withPayments ? (
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
          ) : null}

          {students.length ? (
            <ul className="flex shrink-0 flex-col gap-3">
              {students.map((student) => {
                const paid = student.payment.status === "paid";
                const beforeJoin = shownMonth ? shownMonth < monthKey(new Date(student.joinedAt)) : false;
                const payable = withPayments && !beforeJoin;
                const { homework, attendance } = student;
                const busy = unmarkPaid.isPending;
                const warnings = [
                  homework.missed > 0 ? t("progress.missed", { count: homework.missed }) : null,
                  withPayments && !paid && student.payment.unpaidMonths > 1
                    ? t("progress.unpaidMonths", { count: student.payment.unpaidMonths })
                    : null,
                ].filter(Boolean);
                return (
                  <li key={student.id} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => setOpenStudent(student)}
                    >
                      <Avatar name={student.name} size="sm" className="[&_.avatar]:size-11" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-title text-ink">{student.name}</strong>
                        <small className="truncate text-body-xs text-ink-secondary">
                          {t("progress.joined", { date: formatDate(student.joinedAt) })}
                        </small>
                      </span>
                      {payable ? (
                        <span
                          className={`flex h-7 shrink-0 items-center rounded-full px-3 text-caption-strong ${
                            paid ? "bg-brand-subtle text-brand" : "bg-danger-bg text-danger"
                          }`}
                        >
                          {paid ? t("progress.paid") : t("progress.unpaid")}
                        </span>
                      ) : withPayments ? (
                        <span className="flex h-7 shrink-0 items-center rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
                          {t("progress.notJoinedYet")}
                        </span>
                      ) : null}
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                      <ProgressStat
                        label={t("progress.statAttendance")}
                        value={attendance.percent === null ? "—" : `${attendance.percent}%`}
                        percent={attendance.percent}
                      />
                      <ProgressStat
                        label={t("progress.statHomework")}
                        value={`${homework.submitted}/${homework.total}`}
                        percent={homework.completionPercent}
                      />
                      <ProgressStat
                        label={t("progress.gradeLabel")}
                        value={homework.average === null ? "—" : String(homework.average)}
                      />
                    </div>

                    {warnings.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {warnings.map((warning) => (
                          <span
                            key={warning}
                            className="flex h-6 items-center rounded-full bg-danger-bg px-2.5 text-caption-strong text-danger"
                          >
                            {warning}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {!payable ? null : paid ? (
                      <div className="flex items-center gap-2">
                        <small className="min-w-0 flex-1 truncate text-body-xs text-ink-secondary">
                          {[
                            student.payment.amount !== null
                              ? t("progress.payment.sum", { amount: formatMoney(student.payment.amount) })
                              : "",
                            student.payment.note,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        <button
                          type="button"
                          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-4 text-body-sm font-medium text-ink transition-colors hover:bg-muted"
                          onClick={() => openPayment(student)}
                        >
                          <Icon name="edit" size={16} />
                          {t("progress.payment.edit")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={t("progress.undoPaid")}
                          className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-60"
                          onClick={() => setUnmarkTarget(student)}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-10 items-center justify-center gap-2 rounded-full bg-brand text-body-sm font-medium text-on-action transition-colors hover:bg-brand-strong"
                        onClick={() => openPayment(student)}
                      >
                        <Icon name="check-circle" size={16} />
                        {t("progress.markPaid")}
                      </button>
                    )}
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
        range={range}
        onOpenChange={(open) => !open && setOpenStudent(null)}
      />

      <PaymentDialog
        courseId={courseId}
        target={paying}
        monthlyFee={data?.monthlyFee ?? null}
        onClose={() => setPaying(null)}
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

function ProgressStat({ label, value, percent }: { label: string; value: string; percent?: number | null }) {
  return (
    <span className="flex flex-col gap-1.5 rounded-xl bg-subtle px-3 py-2.5">
      <small className="text-caption text-ink-secondary">{label}</small>
      <strong className="font-numeric text-title leading-5 text-ink">{value}</strong>
      <span className="h-1 overflow-hidden rounded-full bg-line">
        {percent !== null && percent !== undefined ? (
          <span
            className={`block h-full rounded-full ${percent >= 50 ? "bg-brand" : "bg-danger"}`}
            style={{ width: `${percent}%` }}
          />
        ) : null}
      </span>
    </span>
  );
}

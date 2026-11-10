import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { describeCreateError } from "@/modules/auth";
import {
  matchesStudent,
  monthKey,
  paymentMonthBounds,
  shiftMonth,
  sortStudents,
  useCourseProgress,
  useUnmarkPaid,
  type ProgressRange,
  type ProgressSort,
  type StudentProgress,
} from "@/modules/progress";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { PanelHeading } from "./panel-heading";
import { PaymentDialog, type PaymentTarget } from "./payment-dialog";
import { ProgressStudentCard } from "./progress-student-card";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";
import { StudentProgressDialog } from "./student-progress-dialog";
import { TeacherNotifyDialog } from "@/widgets/teacher-notify-dialog";

type PaymentFilter = "all" | "unpaid" | "paid";

interface ProgressPanelProps {
  courseId: string | null;
}

export function ProgressPanel({ courseId }: ProgressPanelProps) {
  const { t, i18n } = useTranslation("group");
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [range, setRange] = useState<ProgressRange>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProgressSort>("name");
  const [openStudent, setOpenStudent] = useState<StudentProgress | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
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
      sortStudents(
        (data?.students ?? []).filter(
          (item) =>
            matchesStudent(item, query) &&
            (!withPayments ||
              filter === "all" ||
              (item.payment.status === filter && !(shownMonth && shownMonth < monthKey(new Date(item.joinedAt)))))
        ),
        sort
      ),
    [data, filter, withPayments, shownMonth, query, sort]
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
      <div className="mb-1 flex shrink-0 items-end gap-3">
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
          className="min-w-0 flex-1"
        />
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong"
          onClick={() => setNotifyOpen(true)}
        >
          <Icon name="campaign" size={18} />
          {t("notification:teacherSend.button")}
        </button>
      </div>
      <TeacherNotifyDialog open={notifyOpen} onOpenChange={setNotifyOpen} courseId={courseId} />

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
            <div className={`grid gap-2 ${withPayments ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}>
              {[
                ...(withPayments
                  ? [{ value: `${data.summary.paid}/${data.summary.students}`, label: t("progress.statPaid") }]
                  : []),
                {
                  value: data.summary.attendancePercent === null ? "—" : `${data.summary.attendancePercent}%`,
                  label: t("progress.statAttendanceLessons", { count: data.lessonCount }),
                },
                {
                  value: data.summary.focusPercent === null ? "—" : `${data.summary.focusPercent}%`,
                  label: t("progress.statFocus"),
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
                  <small className="truncate text-caption">{tile.label}</small>
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

          <div className="flex shrink-0 items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <Icon
                name="search"
                size={18}
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-icon-tertiary"
              />
              <input
                type="search"
                value={query}
                aria-label={t("progress.search")}
                placeholder={t("progress.searchShort")}
                className="h-11 w-full rounded-full border border-transparent bg-surface pr-4 pl-11 text-body-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-focus"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="relative shrink-0">
              <span className="sr-only">{t("progress.sort.label")}</span>
              <select
                value={sort}
                className="h-11 max-w-[46vw] appearance-none truncate rounded-full border border-transparent bg-surface pr-10 pl-4 text-body-sm font-medium text-ink outline-none focus:border-focus lg:max-w-none"
                onChange={(event) => setSort(event.target.value as ProgressSort)}
              >
                {(["name", "attendance", "homework", ...(withPayments ? (["debt"] as const) : [])] as const).map((id) => (
                  <option key={id} value={id}>
                    {t(`progress.sort.${id}`)}
                  </option>
                ))}
              </select>
              <Icon
                name="sort"
                size={18}
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-icon-secondary"
              />
            </label>
          </div>

          {students.length ? (
            <ul className="flex shrink-0 flex-col gap-3">
              {students.map((student) => (
                <ProgressStudentCard
                  key={student.id}
                  student={student}
                  withPayments={withPayments}
                  beforeJoin={shownMonth ? shownMonth < monthKey(new Date(student.joinedAt)) : false}
                  busy={unmarkPaid.isPending}
                  now={now}
                  formatDate={formatDate}
                  formatMoney={formatMoney}
                  onOpen={() => setOpenStudent(student)}
                  onPay={() => openPayment(student)}
                  onUnmark={() => setUnmarkTarget(student)}
                />
              ))}
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

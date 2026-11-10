import { useTranslation } from "react-i18next";
import { INACTIVE_DAYS, daysSinceVisit, type StudentProgress } from "@/modules/progress";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export function ProgressStudentCard({
  student,
  withPayments,
  beforeJoin,
  busy,
  now,
  formatDate,
  formatMoney,
  onOpen,
  onPay,
  onUnmark,
}: {
  student: StudentProgress;
  withPayments: boolean;
  beforeJoin: boolean;
  busy: boolean;
  now: Date;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  onOpen: () => void;
  onPay: () => void;
  onUnmark: () => void;
}) {
  const { t } = useTranslation("group");
  const paid = student.payment.status === "paid";
  const payable = withPayments && !beforeJoin;
  const { homework, attendance } = student;
  const idle = daysSinceVisit(student.lastVisitAt, now);
  const warnings = [
    homework.missed > 0 ? { text: t("progress.missed", { count: homework.missed }), danger: true } : null,
    withPayments && !paid && student.payment.unpaidMonths > 1
      ? { text: t("progress.unpaidMonths", { count: student.payment.unpaidMonths }), danger: true }
      : null,
    homework.resubmitRequested > 0
      ? { text: t("progress.resubmit", { count: homework.resubmitRequested }), danger: false }
      : null,
    idle === null
      ? attendance.total > 0
        ? { text: t("progress.neverVisited"), danger: false }
        : null
      : idle >= INACTIVE_DAYS
        ? { text: t("progress.inactive", { count: idle }), danger: false }
        : null,
  ].filter((item) => item !== null);
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <button
        type="button"
        className="flex items-center gap-3 text-left"
        onClick={onOpen}
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
              paid
                ? "bg-brand-subtle text-brand"
                : student.payment.overdue
                  ? "bg-danger-bg text-danger"
                  : "bg-accent-saffron-bg text-accent-saffron-fg"
            }`}
          >
            {paid ? t("progress.paid") : student.payment.overdue ? t("progress.overdue") : t("progress.unpaid")}
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
          hint={attendance.focusPercent === null ? undefined : t("progress.focusHint", { value: attendance.focusPercent })}
        />
        <ProgressStat
          label={t("progress.statHomework")}
          value={`${homework.submitted}/${homework.total}`}
          percent={homework.completionPercent}
          hint={homework.awaitingReview > 0 ? t("progress.awaitingHint", { count: homework.awaitingReview }) : undefined}
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
              key={warning.text}
              className={`flex h-6 items-center rounded-full px-2.5 text-caption-strong ${
                warning.danger ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning-text"
              }`}
            >
              {warning.text}
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
            onClick={onPay}
          >
            <Icon name="edit" size={16} />
            {t("progress.payment.edit")}
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label={t("progress.undoPaid")}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-60"
            onClick={onUnmark}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-brand text-body-sm font-medium text-on-action transition-colors hover:bg-brand-strong"
          onClick={onPay}
        >
          <Icon name="check-circle" size={16} />
          {t("progress.markPaid")}
        </button>
      )}
    </li>
  );
}

function ProgressStat({ label, value, percent, hint }: { label: string; value: string; percent?: number | null; hint?: string }) {
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
      {hint ? <small className="truncate text-caption text-ink-secondary">{hint}</small> : null}
    </span>
  );
}

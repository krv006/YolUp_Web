import { useTranslation } from "react-i18next";
import { parentAttendance, type AttendanceEntry, type AttendanceStats } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DAY_TONE: Record<string, string> = {
  attended: "bg-accent-green-bg text-accent-green-fg",
  late: "bg-accent-saffron-bg text-accent-saffron-fg",
  missed: "bg-danger-bg text-error-text",
  live: "bg-danger-bg text-error-text",
};

export function AttendanceDonut({ stats }: { stats: AttendanceStats }) {
  const { t } = useTranslation(["parent", "lesson"]);
  const total = stats.attended + stats.late + stats.missed;
  const weekdays = t("lesson:list.weekdaysLong", { returnObjects: true }) as string[];

  if (!total) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-6">
        <span className="grid size-24 place-items-center rounded-full border-[10px] border-subtle">
          <span className="h-1 w-7 rounded-full bg-line-strong" />
        </span>
        <strong className="text-title-sm text-ink-secondary">{t("attendanceView.summary.empty")}</strong>
      </section>
    );
  }

  const parts = [
    { key: "attended", value: stats.attended, stroke: "stroke-success", dot: "bg-success" },
    { key: "late", value: stats.late, stroke: "stroke-saffron", dot: "bg-saffron" },
    { key: "missed", value: stats.missed, stroke: "stroke-danger", dot: "bg-danger" },
  ];
  let offset = 0;

  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-5">
      <div className="flex items-center gap-5">
        <span className="relative grid size-[116px] shrink-0 place-items-center">
          <svg viewBox="0 0 116 116" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="58" cy="58" r={RADIUS} fill="none" strokeWidth="12" className="stroke-subtle" />
            {parts.map((part) => {
              const length = (part.value / total) * CIRCUMFERENCE;
              const circle = (
                <circle
                  key={part.key}
                  cx="58"
                  cy="58"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  className={part.stroke}
                  strokeDasharray={`${Math.max(0, length - 2)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return part.value ? circle : null;
            })}
          </svg>
          <span className="flex flex-col items-center">
            <strong className="font-heading text-[22px]/7 font-semibold text-ink">{stats.percent}%</strong>
            <small className="text-caption text-ink-secondary">{t("attendanceView.summary.label")}</small>
          </span>
        </span>
        <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
          {parts.map((part) => (
            <li key={part.key} className="flex items-center gap-2 text-body-sm text-ink">
              <span className={`size-2.5 shrink-0 rounded-full ${part.dot}`} />
              <span className="flex-1 truncate">{t(`attendanceView.legend.${part.key}`)}</span>
              <strong className="font-semibold">{part.value}</strong>
            </li>
          ))}
        </ul>
      </div>
      {stats.averageFocus !== null ? (
        <p className="flex items-center gap-2 rounded-xl bg-brand-subtle px-3.5 py-2.5 text-body-xs text-brand">
          <Icon name="visibility" size={18} className="shrink-0" />
          {stats.bestWeekday !== null
            ? t("attendanceView.summary.insight", {
                focus: stats.averageFocus,
                day: (weekdays[stats.bestWeekday] ?? "").toLowerCase(),
              })
            : t("attendanceView.summary.insightNoDay", { focus: stats.averageFocus })}
        </p>
      ) : null}
    </section>
  );
}

export function MiniCalendar({
  month,
  byDay,
  now,
  selected,
  onMonth,
  onPick,
}: {
  month: Date;
  byDay: Map<string, AttendanceEntry[]>;
  now: number;
  selected: string | null;
  onMonth: (step: number) => void;
  onPick: (date: Date) => void;
}) {
  const { t } = useTranslation("parent");
  const labels = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const today = parentAttendance.dayKey(now);
  const cells = parentAttendance.monthGrid(month.getFullYear(), month.getMonth());

  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid size-7 place-items-center rounded-full bg-subtle text-icon transition-colors hover:bg-muted"
          aria-label={t("attendanceView.calendar.prev")}
          onClick={() => onMonth(-1)}
        >
          <Icon name="chevron-left" size={18} />
        </button>
        <strong className="flex-1 text-center text-title-sm text-ink">
          {formatLocalized(month, "LLLL yyyy")}
        </strong>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-full bg-subtle text-icon transition-colors hover:bg-muted"
          aria-label={t("attendanceView.calendar.next")}
          onClick={() => onMonth(1)}
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {labels.map((label) => (
          <small key={label} className="pb-1 text-caption text-ink-tertiary">
            {label}
          </small>
        ))}
        {cells.map((date) => {
          const key = parentAttendance.dayKey(date);
          const status = parentAttendance.dayStatus(byDay.get(key));
          const outside = date.getMonth() !== month.getMonth();
          const isToday = key === today;
          const tone = isToday
            ? "bg-brand text-on-action"
            : status && status !== "upcoming"
              ? DAY_TONE[status]
              : "text-ink";
          return (
            <button
              key={key}
              type="button"
              className={`relative grid h-10 place-items-center rounded-xl text-body-sm font-medium transition-opacity hover:opacity-80 ${tone} ${
                outside ? "opacity-35" : ""
              } ${selected === key ? "ring-2 ring-brand ring-inset" : ""}`}
              onClick={() => onPick(date)}
            >
              {date.getDate()}
              {status === "upcoming" && !isToday ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-accent-teal-fg" />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

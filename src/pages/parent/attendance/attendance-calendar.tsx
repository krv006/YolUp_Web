import { useTranslation } from "react-i18next";
import { parentAttendance, type AttendanceEntry, type AttendanceStatus } from "@/modules/parent";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { stayLabel } from "./attendance-format";
import { DateTile, StatusChip } from "./attendance-parts";
import { STATUS_DOT } from "./attendance-styles";

const CHIP: Record<AttendanceStatus, string> = {
  live: "bg-danger-bg text-error-text",
  attended: "bg-success-bg text-success-text",
  late: "bg-warning-bg text-warning-text",
  missed: "bg-danger-bg text-error-text",
  upcoming: "bg-accent-teal-bg text-accent-teal-fg",
};

function shortTitle(title: string): string {
  return title.split(/[\s·-]+/)[0] ?? title;
}

function ChipLabel({ entry }: { entry: AttendanceEntry }) {
  const name = shortTitle(entry.lesson.courseTitle);
  if (entry.status === "late") return <span className="truncate">+{entry.lateMinutes} {name}</span>;
  if (entry.status === "upcoming") return <span className="truncate">{formatMessageTime(entry.lesson.startsAt)} {name}</span>;
  const icon = entry.status === "missed" ? "close" : entry.status === "live" ? null : "check";
  return (
    <>
      {icon ? <Icon name={icon} size={12} className="shrink-0" /> : <span className="size-1.5 shrink-0 rounded-full bg-danger" />}
      <span className="truncate">{name}</span>
    </>
  );
}

export function AttendanceCalendar({
  month,
  byDay,
  now,
  selected,
  onPick,
}: {
  month: Date;
  byDay: Map<string, AttendanceEntry[]>;
  now: number;
  selected: string | null;
  onPick: (key: string) => void;
}) {
  const { t } = useTranslation("parent");
  const labels = t("attendanceView.calendar.weekdays", { returnObjects: true }) as string[];
  const cells = parentAttendance.monthGrid(month.getFullYear(), month.getMonth());
  const today = parentAttendance.dayKey(now);

  return (
    <div className="flex flex-col gap-3">
      <section className="overflow-hidden rounded-[20px] bg-surface px-3 pt-3 pb-1">
        <div className="grid grid-cols-7">
          {labels.map((label) => (
            <small key={label} className="px-2 pb-2 text-caption text-ink-tertiary">
              {label}
            </small>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t border-l border-line">
          {cells.map((date) => {
            const key = parentAttendance.dayKey(date);
            const entries = byDay.get(key) ?? [];
            const outside = date.getMonth() !== month.getMonth();
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                className={`flex h-26 min-w-0 flex-col items-start gap-1.5 border-r border-b border-line p-2 text-left transition-colors hover:bg-subtle ${
                  isToday ? "bg-brand-subtle" : ""
                } ${selected === key ? "outline-2 -outline-offset-2 outline-brand" : ""} ${outside ? "opacity-40" : ""}`}
                onClick={() => onPick(key)}
              >
                <span
                  className={`grid size-7 place-items-center rounded-full text-body-sm font-medium ${
                    isToday ? "bg-brand text-on-action" : "text-ink"
                  }`}
                >
                  {date.getDate()}
                </span>
                {entries.slice(0, 2).map((entry) => (
                  <span
                    key={entry.lesson.id}
                    className={`flex w-full min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]/4 font-semibold ${CHIP[entry.status]}`}
                  >
                    <ChipLabel entry={entry} />
                  </span>
                ))}
                {entries.length > 2 ? (
                  <small className="text-[11px]/4 text-ink-tertiary">+{entries.length - 2}</small>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <div className="flex flex-wrap gap-4 px-1">
        {(["attended", "late", "missed", "upcoming"] as const).map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-caption text-ink-secondary">
            <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
            {t(`attendanceView.legend.${status}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CalendarSide({
  month,
  entries,
  dayEntries,
  dayKey,
  now,
  onOpen,
}: {
  month: Date;
  entries: AttendanceEntry[];
  dayEntries: AttendanceEntry[];
  dayKey: string | null;
  now: number;
  onOpen: (entry: AttendanceEntry) => void;
}) {
  const { t } = useTranslation("parent");
  const inMonth = entries.filter((entry) => parentAttendance.inMonth(entry, month.getFullYear(), month.getMonth()));
  const stats = parentAttendance.attendanceStats(inMonth);
  const [year, monthIndex, day] = (dayKey ?? "").split("-").map(Number);
  const dayDate = dayKey ? new Date(year, monthIndex, day) : null;

  return (
    <div className="flex flex-col gap-5">
      {dayDate ? (
        <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-5">
          <strong className="text-title text-ink">{formatLocalized(dayDate, t("attendanceView.detail.datePattern"))}</strong>
          {dayEntries.length ? (
            dayEntries.map((entry) => (
              <button
                key={entry.lesson.id}
                type="button"
                className="flex items-center gap-3 rounded-2xl px-1 py-1 text-left transition-colors hover:bg-subtle"
                onClick={() => onOpen(entry)}
              >
                <DateTile value={entry.lesson.startsAt} status={entry.status} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{entry.lesson.courseTitle}</strong>
                  <small className="truncate text-body-xs text-ink-secondary">
                    {entry.row?.joinedAt
                      ? `${formatMessageTime(entry.row.joinedAt)} → ${entry.row.leftAt ? formatMessageTime(entry.row.leftAt) : "…"} · ${stayLabel(entry, now, t)}`
                      : formatMessageTime(entry.lesson.startsAt)}
                  </small>
                </span>
                <StatusChip status={entry.status} lateMinutes={entry.lateMinutes} />
              </button>
            ))
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("attendanceView.calendar.noLessons")}</p>
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-2 rounded-[20px] bg-surface p-5">
        <strong className="text-title-sm text-ink">
          {t("attendanceView.calendar.summary", { month: formatLocalized(month, "LLLL") })}
        </strong>
        {[
          { key: "lessons", value: stats.attended + stats.late + stats.missed, tone: "text-ink" },
          { key: "attended", value: stats.attended, tone: "text-success-text" },
          { key: "late", value: stats.late, tone: "text-warning-text" },
          { key: "missed", value: stats.missed, tone: "text-error-text" },
        ].map((row) => (
          <span key={row.key} className="flex items-center justify-between text-body-sm text-ink-secondary">
            {t(`attendanceView.calendar.${row.key}`)}
            <strong className={`font-semibold ${row.tone}`}>{row.value}</strong>
          </span>
        ))}
      </section>
    </div>
  );
}

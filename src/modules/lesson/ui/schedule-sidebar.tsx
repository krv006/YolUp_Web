import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, addDays } from "date-fns";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const TONES = ["bg-action", "bg-success", "bg-saffron-strong", "bg-error", "bg-ink-tertiary"];

export interface ScheduleSidebarProps {
  anchor: Date;
  rangeStart?: Date;
  rangeEnd?: Date;
  lessons: Lesson[];
  onSelectDay: (date: Date) => void;
  onAttendance: (lesson: Lesson) => void;
  onMonthStep: (direction: 1 | -1) => void;
}

export function ScheduleSidebar({
  anchor,
  rangeStart,
  rangeEnd,
  lessons,
  onSelectDay,
  onAttendance,
  onMonthStep,
}: ScheduleSidebarProps) {
  const { t } = useTranslation("lesson");
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const months = t("list.monthsLong", { returnObjects: true }) as string[];
  const byDay = groupLessonsByDay(lessons);

  const [now] = useState(() => Date.now());
  const upcoming = [...lessons]
    .filter((lesson) => lesson.status !== "finished" && lesson.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .find((lesson) => new Date(lesson.startsAt).getTime() + lesson.durationMinutes * 60000 > now);

  const live = upcoming && new Date(upcoming.startsAt).getTime() <= now;
  const minutesLeft = upcoming
    ? Math.max(0, Math.round((new Date(upcoming.startsAt).getTime() - now) / 60000))
    : 0;

  const gridStart = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const hoursByCourse = new Map<string, { title: string; minutes: number }>();
  for (const lesson of lessons) {
    const entry = hoursByCourse.get(lesson.courseId) ?? {
      title: lesson.courseTitle,
      minutes: 0,
    };
    entry.minutes += lesson.durationMinutes || 0;
    hoursByCourse.set(lesson.courseId, entry);
  }
  const groups = [...hoursByCourse.entries()];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-line bg-surface p-4 lg:w-[320px] lg:border-r lg:p-5">
      {upcoming ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-action-subtle p-4">
          <small className="text-caption-strong text-action">
            {live
              ? t("schedule.liveNow")
              : `${t("schedule.now")} · ${
                  minutesLeft >= 1440
                    ? t("schedule.inDays", { count: Math.round(minutesLeft / 1440) })
                    : minutesLeft >= 60
                      ? t("schedule.inHours", { count: Math.round(minutesLeft / 60) })
                      : t("schedule.inMinutes", { count: minutesLeft })
                }`}
          </small>
          <strong className="font-heading text-h3 text-ink">{upcoming.courseTitle}</strong>
          <span className="font-numeric text-body-sm text-ink-secondary">
            {upcoming.time} – {endTime(upcoming)}
          </span>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => onAttendance(upcoming)}
          >
            {t("schedule.attendance")}
          </button>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <strong className="flex-1 font-heading text-title text-ink">
            {months[anchor.getMonth()]} {anchor.getFullYear()}
          </strong>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle"
            onClick={() => onMonthStep(-1)}
            aria-label={t("calendar.prevMonth")}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle"
            onClick={() => onMonthStep(1)}
            aria-label={t("calendar.nextMonth")}
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {weekdays.map((label) => (
            <span key={label} className="py-1 text-center text-caption text-ink-tertiary">
              {label}
            </span>
          ))}
          {days.map((day) => {
            const selected = isSameDay(day, anchor);
            const outside = !isSameMonth(day, anchor);
            const inRange =
              !selected &&
              Boolean(rangeStart && rangeEnd) &&
              day.getTime() >= (rangeStart as Date).setHours(0, 0, 0, 0) &&
              day.getTime() <= (rangeEnd as Date).setHours(23, 59, 59, 999);
            const count = (byDay.get(toDayKey(day)) ?? []).length;
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`relative grid h-9 place-items-center rounded-full font-numeric text-body-sm transition-colors ${
                  selected
                    ? "bg-action text-on-action"
                    : inRange
                      ? "bg-muted text-ink"
                      : outside
                        ? "text-ink-tertiary hover:bg-subtle"
                        : "text-ink hover:bg-subtle"
                } ${isToday(day) && !selected ? "text-action" : ""}`}
                onClick={() => onSelectDay(day)}
              >
                {day.getDate()}
                {count && !selected ? (
                  <span className="absolute bottom-1 size-1 rounded-full bg-action" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <strong className="font-heading text-title text-ink">{t("schedule.myGroups")}</strong>
        {groups.length ? (
          groups.map(([id, group], index) => (
            <span key={id} className="flex items-center gap-2.5">
              <span className={`size-3 shrink-0 rounded-sm ${TONES[index % TONES.length]}`} />
              <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{group.title}</span>
              <small className="shrink-0 font-numeric text-caption text-ink-tertiary">
                {t("schedule.hours", { count: Math.round(group.minutes / 60) })}
              </small>
            </span>
          ))
        ) : (
          <small className="text-caption text-ink-tertiary">{t("schedule.emptyMonth")}</small>
        )}
      </section>
    </aside>
  );
}

function endTime(lesson: Lesson): string {
  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
}

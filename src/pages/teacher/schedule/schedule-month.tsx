import { useTranslation } from "react-i18next";
import { addDays, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import type { Lesson } from "@/shared/types";
import { lessonTone } from "./lesson-tone";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const MAX_CHIPS = 3;

export interface ScheduleMonthProps {
  anchor: Date;
  lessons: Lesson[];
  onSelect: (lesson: Lesson) => void;
  onPickDay: (date: Date) => void;
}

export function ScheduleMonth({ anchor, lessons, onSelect, onPickDay }: ScheduleMonthProps) {
  const { t } = useTranslation("lesson");
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const start = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7));

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface">
      <header className="grid grid-cols-7 border-b border-line-subtle">
        {weekdays.map((label) => (
          <span key={label} className="py-3 text-center text-caption text-ink-tertiary">
            {label}
          </span>
        ))}
      </header>

      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 border-b border-line-subtle last:border-b-0">
          {week.map((day, index) => {
            const rows = lessons.filter((lesson) => isSameDay(new Date(lesson.startsAt), day));
            const outside = !isSameMonth(day, anchor);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`flex min-h-30 flex-col items-start gap-1 border-l border-line-subtle p-2 text-left transition-colors first:border-l-0 hover:bg-subtle ${
                  today ? "bg-brand-subtle/50" : ""
                }`}
                onClick={() => onPickDay(day)}
              >
                <small
                  className={`px-1 text-body-xs ${
                    outside
                      ? "text-ink-disabled"
                      : today
                        ? "text-brand"
                        : index >= 5
                          ? "text-danger"
                          : "text-ink-secondary"
                  }`}
                >
                  {day.getDate()}
                </small>

                {rows.slice(0, MAX_CHIPS).map((lesson) => {
                  const tone = lessonTone(lesson.courseId);
                  return (
                    <span
                      key={lesson.id}
                      className={`flex h-5.5 w-full items-center gap-1.5 rounded-xs px-1.5 ${tone.surface}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(lesson);
                      }}
                    >
                      <i className={`size-1.5 shrink-0 rounded-full not-italic ${tone.chip}`} />
                      <small className="min-w-0 flex-1 truncate text-caption text-ink">
                        {lesson.courseTitle}
                      </small>
                    </span>
                  );
                })}

                {rows.length > MAX_CHIPS ? (
                  <small className="px-1 text-caption text-brand">
                    {t("schedule.moreCount", { count: rows.length - MAX_CHIPS })}
                  </small>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}

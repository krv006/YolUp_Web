import { useMemo, useState } from "react";
import { addMonths, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import {
  buildMonthGrid,
  resolveInitialMonth,
  toDayKey,
  type CalendarDay,
} from "../lib/lesson-calendar";
import { hasLessonTopic, useLessonStatusMeta } from "../lib/lesson-status";
import { LessonActions, type LessonActionsProps } from "./lesson-actions";

export type LessonCalendarProps = Omit<LessonActionsProps, "lesson" | "compact"> & {
  lessons: Lesson[];
};

const MAX_CHIPS = 3;

const CHIP_TONE: Record<string, string> = {
  live: "bg-error text-white",
  finished: "bg-action text-on-action",
  scheduled: "bg-saffron-strong text-white",
  cancelled: "bg-muted text-ink-secondary",
};

function DayCell({
  day,
  selected,
  onSelect,
}: {
  day: CalendarDay;
  selected: boolean;
  onSelect: (day: CalendarDay) => void;
}) {
  const { t } = useTranslation("lesson");
  const lessonStatusMeta = useLessonStatusMeta();
  const hidden = day.lessons.length - MAX_CHIPS;

  return (
    <button
      type="button"
      className={`flex min-h-[72px] flex-col items-start gap-1 rounded-lg border p-1 text-left transition-colors lg:min-h-[96px] lg:p-2 ${
        selected ? "border-action" : "border-line"
      } ${day.inCurrentMonth ? "bg-surface" : "bg-canvas opacity-60"}`}
      aria-pressed={selected}
      aria-label={t("calendar.dayCellAria", {
        date: `${day.date.getDate()}-${(t("list.monthsLong", { returnObjects: true }) as string[])[day.date.getMonth()]}`,
        count: day.lessons.length,
      })}
      onClick={() => onSelect(day)}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full font-numeric text-caption-strong ${
          day.isToday ? "bg-action text-on-action" : "text-ink-secondary"
        }`}
      >
        {day.dayOfMonth}
      </span>

      <span className="flex w-full flex-col gap-1" aria-hidden="true">
        {day.lessons.slice(0, MAX_CHIPS).map((lesson) => (
          <span
            key={lesson.id}
            className={`w-full rounded px-0.5 py-0.5 text-center font-numeric text-[10px] leading-tight font-semibold ${
              CHIP_TONE[lessonStatusMeta(lesson.status).tone] ?? CHIP_TONE.scheduled
            }`}
          >
            {lesson.time}
          </span>
        ))}
        {hidden > 0 ? (
          <span className="px-1 text-[11px] text-ink-tertiary">+{hidden}</span>
        ) : null}
      </span>
    </button>
  );
}

export function LessonCalendar({ lessons, ...actions }: LessonCalendarProps) {
  const { t } = useTranslation("lesson");
  const lessonStatusMeta = useLessonStatusMeta();
  const weekdays = t("calendar.weekdays", { returnObjects: true }) as string[];
  const [month, setMonth] = useState(() => resolveInitialMonth(lessons));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const days = useMemo(() => buildMonthGrid(month, lessons), [month, lessons]);

  const fallbackKey = useMemo(() => {
    const today = days.find((day) => day.isToday && day.inCurrentMonth);
    if (today) return today.key;
    return days.find((day) => day.inCurrentMonth && day.lessons.length)?.key ?? null;
  }, [days]);

  const activeKey =
    selectedKey && days.some((day) => day.key === selectedKey) ? selectedKey : fallbackKey;
  const selected = days.find((day) => day.key === activeKey) ?? null;

  function selectDay(day: CalendarDay) {
    setSelectedKey(day.key);
    if (!day.inCurrentMonth) setMonth(startOfMonth(day.date));
  }

  const monthNames = t("list.monthsLong", { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <strong className="flex-1 font-heading text-h3 text-ink">
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </strong>
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary transition-colors hover:bg-muted"
          aria-label={t("calendar.prevMonth")}
          onClick={() => setMonth((value) => addMonths(value, -1))}
        >
          <Icon name="chevron-left" size={18} />
        </button>
        <button
          type="button"
          className="flex h-10 items-center rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
          onClick={() => {
            const now = new Date();
            setMonth(startOfMonth(now));
            setSelectedKey(toDayKey(now));
          }}
        >
          {t("calendar.todayButton")}
        </button>
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink-secondary transition-colors hover:bg-muted"
          aria-label={t("calendar.nextMonth")}
          onClick={() => setMonth((value) => addMonths(value, 1))}
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center" aria-hidden="true">
        {weekdays.map((label, index) => (
          <span key={index} className="text-caption-strong tracking-wide text-ink-tertiary uppercase">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5" role="grid">
        {days.map((day) => (
          <DayCell key={day.key} day={day} selected={day.key === activeKey} onSelect={selectDay} />
        ))}
      </div>

      {selected ? (
        <section
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
          aria-live="polite"
        >
          <header className="flex items-baseline gap-3">
            <strong className="flex-1 text-title text-ink">
              {`${selected.date.getDate()}-${(t("list.monthsLong", { returnObjects: true }) as string[])[selected.date.getMonth()]}`}
            </strong>
            <small className="text-caption text-ink-tertiary">
              {t("calendar.lessonsCount", { count: selected.lessons.length })}
            </small>
          </header>

          {selected.lessons.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {selected.lessons.map((lesson) => {
                const meta = lessonStatusMeta(lesson.status);
                return (
                  <li key={lesson.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex w-14 shrink-0 flex-col">
                      <b className="font-numeric text-title text-ink">{lesson.time}</b>
                      <i className="text-caption text-ink-tertiary not-italic">
                        {t("list.durationShort", { count: lesson.durationMinutes })}
                      </i>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <strong
                        className={`truncate text-label-strong ${
                          hasLessonTopic(lesson) ? "text-ink" : "text-ink-tertiary italic"
                        }`}
                      >
                        {hasLessonTopic(lesson) ? lesson.title : t("list.missingTopic")}
                      </strong>
                      <em
                        className={`inline-flex h-6 w-fit items-center rounded-full px-2.5 text-caption-strong not-italic ${
                          CHIP_TONE[meta.tone] ?? CHIP_TONE.scheduled
                        }`}
                      >
                        {meta.label}
                      </em>
                    </span>
                    <LessonActions lesson={lesson} compact {...actions} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("calendar.noLessonsThisDay")}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

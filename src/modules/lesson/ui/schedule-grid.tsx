import { useTranslation } from "react-i18next";
import {
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_HEIGHT = 100;

export interface ScheduleViewProps {
  anchor: Date;
  lessons: Lesson[];
  onSelect: (lesson: Lesson) => void;
  onSelectDay?: (date: Date) => void;
}

function useWeekdays(): string[] {
  const { t } = useTranslation("lesson");
  return t("list.weekdaysShort", { returnObjects: true }) as string[];
}

function lessonTone(lesson: Lesson): string {
  if (lesson.status === "live") return "border-error bg-error-bg text-error-text";
  if (lesson.status === "finished") return "border-line bg-subtle text-ink-secondary";
  if (lesson.status === "cancelled") return "border-line bg-muted text-ink-tertiary line-through";
  return "border-action/40 bg-action-subtle text-action";
}

function minutesFromStart(date: Date): number {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

function endTime(lesson: Lesson): string {
  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
}

function HourColumn() {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  return (
    <div className="w-16 shrink-0">
      {hours.map((hour) => (
        <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
          <span className="absolute -top-2 right-3 font-numeric text-caption text-ink-tertiary">
            {String(hour).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}

function LessonBlock({
  lesson,
  onSelect,
}: {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
}) {
  const start = new Date(lesson.startsAt);
  const top = (minutesFromStart(start) / 60) * HOUR_HEIGHT;
  const height = Math.max(44, ((lesson.durationMinutes || 45) / 60) * HOUR_HEIGHT - 6);

  return (
    <button
      type="button"
      className={`absolute right-1 left-1 flex flex-col gap-0.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-opacity hover:opacity-85 ${lessonTone(lesson)}`}
      style={{ top, height }}
      onClick={() => onSelect(lesson)}
    >
      <strong className="truncate text-caption-strong">{lesson.courseTitle}</strong>
      {lesson.topic ? <span className="truncate text-caption">{lesson.topic}</span> : null}
      <span className="font-numeric text-caption">
        {lesson.time} – {endTime(lesson)}
      </span>
    </button>
  );
}

export function ScheduleWeek({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t } = useTranslation("lesson");
  const weekdays = useWeekdays();
  const byDay = groupLessonsByDay(lessons);
  const days = Array.from({ length: 7 }, (_, index) => addDays(anchor, index - 3));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex shrink-0 border-b border-line bg-surface pr-4">
        <span className="w-16 shrink-0" />
        {days.map((day) => {
          const active = isSameDay(day, anchor);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors hover:bg-subtle"
              onClick={() => onSelectDay?.(day)}
            >
              <small
                className={`text-caption ${
                  active || isToday(day) ? "text-action" : "text-ink-tertiary"
                }`}
              >
                {weekdays[(day.getDay() + 6) % 7]}
              </small>
              <span
                className={`grid size-8 place-items-center rounded-full font-heading text-title ${
                  active
                    ? "bg-action text-on-action"
                    : isToday(day)
                      ? "border border-action text-action"
                      : "text-ink"
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 overflow-y-auto pt-4">
        <HourColumn />
        <div className="relative flex flex-1">
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => (
            <span
              key={index}
              className="pointer-events-none absolute inset-x-0 border-t border-line"
              style={{ top: index * HOUR_HEIGHT }}
            />
          ))}
          {days.map((day) => {
            const items = byDay.get(toDayKey(day)) ?? [];
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-l border-line ${
                  weekend ? "bg-subtle/40" : ""
                } ${isSameDay(day, anchor) ? "bg-action-subtle/40" : ""}`}
                style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
              >
                {weekend && !items.length ? (
                  <span className="absolute inset-x-0 top-3 text-center text-caption text-ink-tertiary">
                    {t("schedule.weekend")}
                  </span>
                ) : null}
                {items.map((lesson) => (
                  <LessonBlock key={lesson.id} lesson={lesson} onSelect={onSelect} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ScheduleDay({ anchor, lessons, onSelect }: ScheduleViewProps) {
  const { t } = useTranslation("lesson");
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const months = t("list.months", { returnObjects: true }) as string[];
  const items = (groupLessonsByDay(lessons).get(toDayKey(anchor)) ?? []).filter(Boolean);
  const finished = items.filter((item) => item.status === "finished").length;
  const live = items.filter((item) => item.status === "live").length;
  const left = items.length - finished - live;
  const weekdayIndex = (anchor.getDay() + 6) % 7;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action-subtle font-numeric text-caption-strong text-action">
          {anchor.getDate()}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate font-heading text-title text-ink">
            {weekdaysLong?.[weekdayIndex] ?? ""}, {anchor.getDate()}-
            {(months[anchor.getMonth()] ?? "").toLowerCase()}
          </strong>
          <small className="text-caption text-ink-tertiary">
            {isToday(anchor) ? `${t("schedule.today")} · ` : ""}
            {t("schedule.lessonCount", { count: items.length })}
          </small>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-success-bg px-3 py-1 text-caption-strong text-success-text">
            {t("schedule.finishedCount", { count: finished })}
          </span>
          <span className="rounded-full bg-action-subtle px-3 py-1 text-caption-strong text-action">
            {t("schedule.liveCount", { count: live })}
          </span>
          <span className="rounded-full bg-saffron-subtle px-3 py-1 text-caption-strong text-saffron-strong">
            {t("schedule.leftCount", { count: Math.max(0, left) })}
          </span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 overflow-y-auto pt-4">
        <HourColumn />
        <div
          className="relative flex-1 border-l border-line"
          style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
        >
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => (
            <span
              key={index}
              className="pointer-events-none absolute inset-x-0 border-t border-line"
              style={{ top: index * HOUR_HEIGHT }}
            />
          ))}
          {items.map((lesson) => (
            <LessonBlock key={lesson.id} lesson={lesson} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScheduleMonth({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t } = useTranslation("lesson");
  const weekdays = useWeekdays();
  const byDay = groupLessonsByDay(lessons);
  const start = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex shrink-0 border-b border-line bg-surface">
        {weekdays.map((label, index) => (
          <span
            key={label}
            className={`flex-1 px-3 py-2.5 text-caption ${
              index > 4 ? "text-ink-tertiary" : "text-ink-secondary"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex min-h-[120px] flex-1 border-b border-line">
            {week.map((day, index) => {
              const items = byDay.get(toDayKey(day)) ?? [];
              const outside = !isSameMonth(day, anchor);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`flex min-w-0 flex-1 flex-col gap-1.5 border-l border-line p-2 text-left transition-colors hover:bg-subtle ${
                    outside ? "bg-canvas" : "bg-surface"
                  } ${index > 4 && !outside ? "bg-subtle/50" : ""} ${
                    isSameDay(day, anchor) ? "bg-action-subtle/40" : ""
                  }`}
                  onClick={() => onSelectDay?.(day)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid size-7 place-items-center rounded-full font-numeric text-caption-strong ${
                        isToday(day)
                          ? "bg-action text-on-action"
                          : outside
                            ? "text-ink-tertiary"
                            : "text-ink"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {isToday(day) ? (
                      <small className="text-caption text-action">{t("schedule.today")}</small>
                    ) : null}
                  </span>

                  <span className="flex min-w-0 flex-col gap-1">
                    {items.slice(0, 3).map((lesson) => (
                      <span
                        key={lesson.id}
                        className={`truncate rounded-md border px-1.5 py-0.5 text-caption ${lessonTone(lesson)}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(lesson);
                        }}
                      >
                        {lesson.courseTitle}
                      </span>
                    ))}
                    {items.length > 3 ? (
                      <small className="text-caption text-ink-tertiary">+{items.length - 3}</small>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleList({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t } = useTranslation("lesson");
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const byDay = groupLessonsByDay(lessons);
  const days = Array.from({ length: 7 }, (_, index) => addDays(anchor, index));

  function dayLabel(day: Date): string {
    const weekday = weekdaysLong?.[(day.getDay() + 6) % 7] ?? "";
    const date = `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;
    if (isToday(day)) return `${t("schedule.today")}, ${date} · ${weekday}`;
    if (isSameDay(day, addDays(new Date(), 1))) return `${t("schedule.tomorrow")}, ${date} · ${weekday}`;
    return `${date} · ${weekday}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-canvas p-4 lg:p-6">
      {days.map((day) => {
        const items = byDay.get(toDayKey(day)) ?? [];
        const weekend = day.getDay() === 0 || day.getDay() === 6;
        return (
          <section key={day.toISOString()} className="flex flex-col gap-2">
            <button
              type="button"
              className="flex items-baseline gap-3 text-left"
              onClick={() => onSelectDay?.(day)}
            >
              <strong className="flex-1 truncate text-title text-ink">{dayLabel(day)}</strong>
              <small className={`shrink-0 text-label-strong ${items.length ? "text-action" : "text-ink-tertiary"}`}>
                {items.length
                  ? t("schedule.lessonCountShort", { count: items.length })
                  : weekend
                    ? t("schedule.dayOff")
                    : ""}
              </small>
            </button>

            {items.length ? (
              items.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-subtle"
                  onClick={() => onSelect(lesson)}
                >
                  <span
                    className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${
                      lesson.status === "live"
                        ? "bg-error"
                        : lesson.status === "finished"
                          ? "bg-muted"
                          : "bg-action"
                    }`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">
                      {lesson.courseTitle}
                    </strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {[lesson.topic || t("schedule.online"), lesson.quizId ? t("schedule.quizAttached") : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <strong className="font-numeric text-label-strong text-ink">{lesson.time}</strong>
                    <small className="font-numeric text-caption text-ink-tertiary">
                      {endTimeOf(lesson)}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <p className="text-body-sm text-ink-tertiary">{t("schedule.noLessonsDay")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function endTimeOf(lesson: Lesson): string {
  return endTime(lesson);
}

export function ScheduleEmpty({
  title,
  onCreate,
  canCreate,
}: {
  title: string;
  onCreate: () => void;
  canCreate: boolean;
}) {
  const { t } = useTranslation("lesson");
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
        <Icon name="nav-calendar" size={26} />
      </span>
      <strong className="font-heading text-h3 text-ink">{title}</strong>
      <p className="max-w-[360px] text-body-sm text-ink-secondary">{t("schedule.emptyHint")}</p>
      {canCreate ? (
        <button
          type="button"
          className="mt-1 flex h-12 items-center gap-2 rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={onCreate}
        >
          <Icon name="add" size={18} /> {t("schedule.addLesson")}
        </button>
      ) : null}
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-canvas p-4 lg:p-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
          <span className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
          <span className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
          <span className="h-16 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}

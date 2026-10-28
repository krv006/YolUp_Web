import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { addDays, isSameDay, isToday, startOfWeek } from "date-fns";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import { lessonTone } from "./lesson-tone";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 52;
const GUTTER = 72;

export interface ScheduleWeekProps {
  anchor: Date;
  lessons: Lesson[];
  now: Date;
  onSelect: (lesson: Lesson) => void;
  onCreate?: () => void;
}

function minutesFromStart(date: Date): number {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function ScheduleWeek({ anchor, lessons, now, onSelect, onCreate }: ScheduleWeekProps) {
  const { t } = useTranslation("lesson");
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const nowOffset = (minutesFromStart(now) / 60) * HOUR_HEIGHT;
  const showNow = nowOffset >= 0 && nowOffset <= (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const empty = !lessons.length;
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = Math.max(0, nowOffset - node.clientHeight / 2);
  }, [nowOffset]);

  return (
    <section className="relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface">
      <header
        className="grid shrink-0 border-b border-line-subtle"
        style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
      >
        <span />
        {days.map((day, index) => {
          const today = isToday(day);
          const weekend = index >= 5;
          return (
            <span
              key={day.toISOString()}
              className="flex flex-col items-center gap-1 border-l border-line-subtle py-3"
            >
              <small className={`text-caption ${weekend ? "text-danger" : "text-ink-tertiary"}`}>
                {weekdays[index]}
              </small>
              <strong
                className={`grid size-7 place-items-center rounded-full text-title-sm ${
                  today
                    ? "bg-brand text-ink-inverse"
                    : weekend
                      ? "text-danger"
                      : "text-ink"
                }`}
              >
                {day.getDate()}
              </strong>
            </span>
          );
        })}
      </header>

      <div ref={scrollRef} className="h-[calc(100dvh-262px)] min-h-90 overflow-y-auto overscroll-contain pt-1">
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
        >
          <div className="flex flex-col">
            {hours.map((hour) => (
              <span
                key={hour}
                className="relative border-b border-line-subtle"
                style={{ height: HOUR_HEIGHT }}
              >
                <small className="absolute top-1 left-3 text-caption text-ink-tertiary">
                  {String(hour).padStart(2, "0")}:00
                </small>
              </span>
            ))}
          </div>

          {days.map((day) => {
            const rows = lessons.filter((lesson) => isSameDay(new Date(lesson.startsAt), day));
            return (
              <div key={day.toISOString()} className="relative border-l border-line-subtle">
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className="block border-b border-line-subtle"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {rows.map((lesson) => {
                  const date = new Date(lesson.startsAt);
                  const top = (minutesFromStart(date) / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    ((lesson.durationMinutes || 45) / 60) * HOUR_HEIGHT,
                    38
                  );
                  const tone = lessonTone(lesson.courseId);
                  const live = lesson.status === "live";
                  const cancelled = lesson.status === "cancelled";
                  const finished = lesson.status === "finished";

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`absolute right-1 left-1 flex flex-col items-start gap-0.5 overflow-hidden rounded-sm pt-1.5 pr-2 pb-1 pl-2.5 text-left transition-opacity hover:opacity-90 ${
                        live
                          ? "bg-brand text-ink-inverse"
                          : finished
                            ? "bg-subtle text-ink-secondary"
                            : `${tone.surface} ${tone.text}`
                      } ${cancelled ? "opacity-55" : ""}`}
                      style={{
                        top,
                        height,
                        borderLeft: "3px solid",
                        borderLeftColor: live ? "transparent" : undefined,
                      }}
                      onClick={() => onSelect(lesson)}
                    >
                      <span
                        className={`absolute top-0 bottom-0 left-0 w-[3px] ${
                          live ? "bg-ink-inverse/60" : finished ? "bg-line-strong" : tone.bar
                        }`}
                      />
                      {live ? (
                        <i className="absolute -top-1 -left-1 size-2 rounded-full bg-danger not-italic" />
                      ) : null}
                      <strong className="w-full truncate text-caption-strong">
                        {lesson.courseTitle}
                      </strong>
                      <small className="w-full truncate text-caption">
                        {clock(date)}
                        {live
                          ? ` · ${t("schedule.live")}`
                          : cancelled
                            ? ` · ${t("schedule.cancelled")}`
                            : finished
                              ? ` · ${t("schedule.finished")}`
                              : lesson.title
                                ? ` · ${lesson.title}`
                                : ""}
                      </small>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {showNow ? (
            <span
              className="pointer-events-none absolute right-0 left-0 flex items-center"
              style={{ top: nowOffset }}
            >
              <span style={{ width: GUTTER }} />
              <span className="relative h-px flex-1 bg-danger">
                <i className="absolute -top-1 -left-1 size-2 rounded-full bg-danger not-italic" />
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {empty ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-xl bg-surface px-8 py-7 text-center shadow-xl">
            <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon name="calendar-month" size={28} />
            </span>
            <strong className="font-heading text-h2 text-ink">{t("schedule.emptyWeek")}</strong>
            <p className="max-w-80 text-body-sm text-ink-secondary">
              {onCreate ? t("schedule.emptyWeekHint") : t("schedule.emptyStudentHint")}
            </p>
            {onCreate ? (
              <button
                type="button"
                className="flex h-11 items-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                onClick={onCreate}
              >
                {t("schedule.create")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

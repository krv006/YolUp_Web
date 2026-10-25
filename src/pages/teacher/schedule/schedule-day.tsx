import { useTranslation } from "react-i18next";
import { addDays, isSameDay, isToday, startOfWeek } from "date-fns";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export interface ScheduleDayProps {
  anchor: Date;
  lessons: Lesson[];
  now: Date;
  studentCounts: Map<string, number>;
  onPickDay: (date: Date) => void;
  onSelect: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
}

function clock(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endClock(lesson: Lesson): string {
  const date = new Date(lesson.startsAt);
  return clock(new Date(date.getTime() + (lesson.durationMinutes || 45) * 60_000));
}

function minutesUntil(lesson: Lesson, now: Date): number {
  return Math.round((new Date(lesson.startsAt).getTime() - now.getTime()) / 60_000);
}

export function ScheduleDay({
  anchor,
  lessons,
  now,
  studentCounts,
  onPickDay,
  onSelect,
  onChat,
}: ScheduleDayProps) {
  const { t } = useTranslation("lesson");
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  const rows = [...lessons].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next =
    rows.find((lesson) => lesson.status === "live") ??
    rows.find((lesson) => new Date(lesson.startsAt).getTime() >= now.getTime()) ??
    null;
  const finished = rows.filter((lesson) => lesson.status === "finished").length;
  const students = rows.reduce(
    (sum, lesson) => sum + (studentCounts.get(lesson.courseId) ?? 0),
    0
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const active = isSameDay(day, anchor);
            const weekend = index >= 5;
            const has = lessons.some((lesson) => isSameDay(new Date(lesson.startsAt), day));
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                  active ? "bg-brand text-ink-inverse" : "bg-surface hover:bg-subtle"
                }`}
                onClick={() => onPickDay(day)}
              >
                <small
                  className={`text-caption ${
                    active ? "opacity-80" : weekend ? "text-danger" : "text-ink-tertiary"
                  }`}
                >
                  {weekdays[index]}
                </small>
                <strong className={`text-title ${active ? "" : isToday(day) ? "text-brand" : ""}`}>
                  {day.getDate()}
                </strong>
                {has && !active ? <i className="size-1 rounded-full bg-brand not-italic" /> : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <strong className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">
            {isToday(anchor) ? t("schedule.today") : ""}
            {isToday(anchor) ? ", " : ""}
            {anchor.getDate()}-
            {(t("list.monthsLong", { returnObjects: true }) as string[])[anchor.getMonth()]}
          </strong>
          <small className="shrink-0 text-body-xs text-ink-tertiary">
            {t("list.dayCount", { count: rows.length })}
          </small>
        </div>

        <div className="flex flex-col">
          {rows.map((lesson) => {
            const live = lesson.status === "live";
            const soon = next?.id === lesson.id && !live;
            const minutes = minutesUntil(lesson, now);
            const highlight = live || (soon && minutes >= 0 && minutes <= 90);

            return (
              <div key={lesson.id} className="flex gap-4">
                <span className="flex w-14 shrink-0 flex-col items-end pt-4 text-right">
                  <strong className="text-title-sm text-ink">{clock(lesson.startsAt)}</strong>
                  <small className="text-body-xs text-ink-tertiary">{endClock(lesson)}</small>
                </span>

                <span className="relative flex w-3 shrink-0 justify-center">
                  <i className="absolute top-0 bottom-0 w-px bg-line-subtle not-italic" />
                  <i
                    className={`relative mt-5.5 size-2 rounded-full not-italic ${
                      highlight ? "bg-brand" : "bg-line-strong"
                    }`}
                  />
                </span>

                {highlight ? (
                  <button
                    type="button"
                    className="mb-3 flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-brand p-5 text-left text-ink-inverse"
                    onClick={() => onSelect(lesson)}
                  >
                    <span className="flex h-7 w-fit items-center gap-1.5 rounded-full bg-surface/20 px-3 text-caption-strong">
                      <Icon name="schedule" size={13} />
                      {live
                        ? t("schedule.live")
                        : t("schedule.startsIn", { count: Math.max(minutes, 0) })}
                    </span>
                    <strong className="w-full truncate font-heading text-h2">
                      {lesson.courseTitle}
                    </strong>
                    <small className="w-full truncate text-body-sm opacity-90">
                      {t("schedule.studentsAndDuration", {
                        count: studentCounts.get(lesson.courseId) ?? 0,
                        minutes: lesson.durationMinutes || 45,
                      })}
                    </small>
                    <span
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface text-button text-brand transition-colors hover:bg-subtle"
                      onClick={(event) => {
                        event.stopPropagation();
                        onChat(lesson);
                      }}
                    >
                      <Icon name="chat" size={18} />
                      {t("schedule.openChat")}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mb-3 flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-surface p-4 text-left transition-colors hover:bg-subtle"
                    onClick={() => onSelect(lesson)}
                  >
                    <span className="flex w-14 shrink-0 flex-col">
                      <strong className="text-title-sm text-ink">{clock(lesson.startsAt)}</strong>
                      <small className="text-body-xs text-ink-tertiary">{endClock(lesson)}</small>
                    </span>
                    <GroupTile
                      name={lesson.courseTitle}
                      className="size-9 shrink-0 rounded-md text-caption-strong"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-lg text-ink">
                        {lesson.courseTitle}
                      </strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {t("schedule.students", {
                          count: studentCounts.get(lesson.courseId) ?? 0,
                        })}
                        {lesson.status === "finished" ? ` · ${t("schedule.finished")}` : ""}
                        {lesson.status === "cancelled" ? ` · ${t("schedule.cancelled")}` : ""}
                      </small>
                    </span>
                    <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
                  </button>
                )}
              </div>
            );
          })}

          {!rows.length ? (
            <p className="rounded-lg bg-surface px-5 py-10 text-center text-body-sm text-ink-tertiary">
              {t("schedule.emptyDay")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <strong className="text-title text-ink">{t("schedule.nextLesson")}</strong>

        {next ? (
          <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
            <span className="flex h-7 w-fit items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
              <Icon name="schedule" size={13} />
              {next.status === "live"
                ? t("schedule.live")
                : t("schedule.startsIn", { count: Math.max(minutesUntil(next, now), 0) })}
            </span>

            <strong className="text-title-lg text-ink">
              <span className="text-brand">{next.courseTitle}</span>{" "}
              {t("schedule.startsLabel")}
            </strong>

            <small className="text-body-xs text-ink-tertiary">
              {clock(next.startsAt)} – {endClock(next)}
            </small>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
              onClick={() => onChat(next)}
            >
              <Icon name="chat" size={18} />
              {t("schedule.openChat")}
            </button>
          </section>
        ) : (
          <p className="rounded-lg bg-surface px-5 py-6 text-center text-body-sm text-ink-tertiary">
            {t("schedule.noNext")}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label={t("schedule.doneCount")} value={`${finished} / ${rows.length}`} />
          <StatCard label={t("schedule.studentCount")} value={String(students)} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className="font-heading text-display text-ink">{value}</strong>
    </div>
  );
}

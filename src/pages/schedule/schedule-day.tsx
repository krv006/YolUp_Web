import { useTranslation } from "react-i18next";
import { addDays, isSameDay, isToday, startOfWeek } from "date-fns";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import type { CourseLook } from "./lesson-tone";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const OPEN_MINUTES = 10;

export interface ScheduleDayProps {
  anchor: Date;
  lessons: Lesson[];
  now: Date;
  courseLook: (courseId: string) => CourseLook;
  student?: boolean;
  attendanceRate?: number | null;
  onPickDay: (date: Date) => void;
  onSelect: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
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
  courseLook,
  student = false,
  attendanceRate = null,
  onPickDay,
  onSelect,
  onChat,
  onJoin,
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
  const students = rows.reduce((sum, lesson) => sum + courseLook(lesson.courseId).students, 0);
  const nextMinutes = next ? minutesUntil(next, now) : 0;

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
            {((t("list.monthsLong", { returnObjects: true }) as string[])[anchor.getMonth()] ?? "").toLowerCase()}
          </strong>
          <small className="shrink-0 text-body-xs text-ink-tertiary">
            {t("schedule.lessonCount", { count: rows.length })}
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
                      {student
                        ? t("schedule.teacherDuration", {
                            teacher: courseLook(lesson.courseId).teacher,
                            count: lesson.durationMinutes || 45,
                          })
                        : t("schedule.studentsAndDuration", {
                            count: courseLook(lesson.courseId).students,
                            minutes: lesson.durationMinutes || 45,
                          })}
                    </small>
                    <span
                      className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface text-button transition-colors hover:bg-subtle ${
                        student ? "text-ink" : "text-brand"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (student) onJoin(lesson);
                        else onChat(lesson);
                      }}
                    >
                      <Icon name={student ? "videocam-fill" : "chat"} size={18} />
                      {student ? t("schedule.join") : t("schedule.openChat")}
                    </span>
                  </button>
                ) : student ? (
                  <StudentRow lesson={lesson} look={courseLook(lesson.courseId)} onSelect={onSelect} />
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
                      tone={courseLook(lesson.courseId).tone}
                      src={courseLook(lesson.courseId).image}
                      className="size-9 shrink-0 rounded-md text-caption-strong"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title-lg text-ink">
                        {lesson.courseTitle}
                      </strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {t("schedule.students", { count: courseLook(lesson.courseId).students })}
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
        <strong className="text-title text-ink">
          {student && next && (next.status === "live" || nextMinutes <= OPEN_MINUTES)
            ? t("schedule.nowOpen")
            : t("schedule.nextLesson")}
        </strong>

        {next && student ? (
          <section className="relative flex flex-col overflow-hidden rounded-2xl bg-brand-subtle p-2">
            <CardPattern />
            <span className="relative flex flex-col gap-1 px-1.5 pt-1.5 pb-3.5">
              <span className="flex items-center gap-1.5 text-body-xs text-ink">
                <Icon name="timer" size={20} />
                {next.status === "live"
                  ? t("schedule.live")
                  : t("schedule.startsIn", { count: Math.max(nextMinutes, 0) })}
              </span>
              <strong className="truncate font-heading text-title-lg font-bold text-brand">{next.courseTitle}</strong>
              <small className="text-body-sm text-ink-secondary">
                {clock(next.startsAt)} - {endClock(next)}
              </small>
            </span>
            <button
              type="button"
              className="relative flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-body-xs font-semibold text-ink-inverse transition-colors hover:bg-brand-strong"
              onClick={() => onChat(next)}
            >
              <Icon name="chat" size={18} />
              {t("schedule.openChat")}
            </button>
          </section>
        ) : next ? (
          <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
            <span className="flex h-7 w-fit items-center gap-1.5 rounded-full bg-subtle px-3 text-caption-strong text-ink-secondary">
              <Icon name="schedule" size={13} />
              {next.status === "live"
                ? t("schedule.live")
                : t("schedule.startsIn", { count: Math.max(nextMinutes, 0) })}
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

        {student ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("schedule.todayStat")} value={`${finished} / ${rows.length}`} />
            <StatCard label={t("schedule.attendanceStat")} value={attendanceRate === null ? "—" : `${attendanceRate}%`} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("schedule.doneCount")} value={`${finished} / ${rows.length}`} />
            <StatCard label={t("schedule.studentCount")} value={String(students)} />
          </div>
        )}
      </div>
    </div>
  );
}

function StudentRow({ lesson, look, onSelect }: { lesson: Lesson; look: CourseLook; onSelect: (lesson: Lesson) => void }) {
  const { t } = useTranslation("lesson");
  const finished = lesson.status === "finished";
  const cancelled = lesson.status === "cancelled";
  return (
    <button
      type="button"
      className="mb-2 flex min-h-[68px] min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface px-3 py-3 text-left transition-colors hover:bg-subtle"
      onClick={() => onSelect(lesson)}
    >
      <span className={`flex w-11 shrink-0 flex-col ${finished || cancelled ? "opacity-50" : ""}`}>
        <strong className="text-body-sm font-semibold text-ink">{clock(lesson.startsAt)}</strong>
        <small className="text-caption text-ink-secondary">{endClock(lesson)}</small>
      </span>
      <GroupTile
        name={lesson.courseTitle}
        tone={look.tone}
        src={look.image}
        className={`size-11 shrink-0 rounded-xl text-caption-strong ${finished || cancelled ? "opacity-50" : ""}`}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className={`truncate text-title ${finished || cancelled ? "text-ink-tertiary" : "text-ink"}`}>
          {lesson.courseTitle}
        </strong>
        {finished ? (
          <small className="flex items-center gap-1 truncate text-body-sm text-success-fg/70">
            <Icon name="check" size={16} className="shrink-0" />
            {t("schedule.finishedBy", { teacher: look.teacher })}
          </small>
        ) : cancelled ? (
          <small className="truncate text-body-sm text-danger/70">
            {[look.teacher, t("schedule.cancelled")].filter(Boolean).join(" · ")}
          </small>
        ) : (
          <small className="truncate text-body-sm text-ink-secondary">{look.teacher}</small>
        )}
      </span>
      <Icon name="chevron-right" size={18} className="shrink-0 text-icon-secondary" />
    </button>
  );
}

const PATTERN: { x: number; y: number; h: number; corner: "tl" | "tr" | "bl" | "br" }[] = [
  { x: 78, y: 0, h: 34, corner: "bl" },
  { x: 116, y: 0, h: 34, corner: "tr" },
  { x: 156, y: 0, h: 34, corner: "tr" },
  { x: 78, y: 38, h: 34, corner: "tl" },
  { x: 116, y: 38, h: 34, corner: "tr" },
  { x: 156, y: 38, h: 34, corner: "br" },
  { x: 194, y: 38, h: 34, corner: "bl" },
  { x: 0, y: 77, h: 72, corner: "tl" },
  { x: 38, y: 77, h: 72, corner: "tr" },
  { x: 78, y: 77, h: 72, corner: "tl" },
  { x: 116, y: 77, h: 72, corner: "tl" },
  { x: 156, y: 77, h: 72, corner: "tr" },
  { x: 194, y: 77, h: 72, corner: "tr" },
];

function patternPath({ x, y, h, corner }: (typeof PATTERN)[number]): string {
  const s = 34;
  if (corner === "tl") return `M${x} ${y + h}V${y + s}A${s} ${s} 0 0 1 ${x + s} ${y}V${y + h}Z`;
  if (corner === "tr") return `M${x} ${y + h}V${y}A${s} ${s} 0 0 1 ${x + s} ${y + s}V${y + h}Z`;
  if (corner === "bl") return `M${x} ${y}H${x + s}V${y + h}A${s} ${s} 0 0 1 ${x} ${y + h - s}Z`;
  return `M${x} ${y}H${x + s}V${y + h - s}A${s} ${s} 0 0 1 ${x} ${y + h}Z`;
}

function CardPattern() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 228 149"
      className="pointer-events-none absolute top-0 right-0 h-[149px] w-[228px] text-surface"
      fill="currentColor"
    >
      {PATTERN.map((item) => (
        <path key={`${item.x}-${item.y}`} d={patternPath(item)} />
      ))}
    </svg>
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

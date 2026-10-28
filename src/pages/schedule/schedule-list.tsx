import { useTranslation } from "react-i18next";
import { addDays, isSameDay } from "date-fns";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import type { Lesson, LessonStatus } from "@/shared/types";
import type { CourseLook } from "./lesson-tone";

const CHIP: Record<LessonStatus, { tone: string; icon: string }> = {
  finished: { tone: "bg-subtle text-ink-secondary", icon: "check-circle" },
  live: { tone: "bg-danger-bg text-error-text", icon: "videocam-fill" },
  scheduled: { tone: "bg-accent-teal-bg text-accent-teal-fg", icon: "schedule" },
  cancelled: { tone: "bg-subtle text-ink-tertiary", icon: "cancel" },
};

export interface ScheduleListProps {
  lessons: Lesson[];
  now: Date;
  courseLook: (courseId: string) => CourseLook;
  onSelect: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
}

function clock(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function ScheduleList({ lessons, now, courseLook, onSelect, onJoin }: ScheduleListProps) {
  const { t } = useTranslation("lesson");
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];

  const groups: { key: string; day: Date; rows: Lesson[] }[] = [];
  for (const lesson of [...lessons].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const day = new Date(lesson.startsAt);
    const key = day.toDateString();
    const group = groups.find((item) => item.key === key);
    if (group) group.rows.push(lesson);
    else groups.push({ key, day, rows: [lesson] });
  }

  function label(day: Date): string {
    const date = `${weekdaysLong[(day.getDay() + 6) % 7] ?? ""}, ${day.getDate()}-${monthsLong[day.getMonth()] ?? ""}`;
    if (isSameDay(day, now)) return `${t("schedule.dayToday")} · ${date}`;
    if (isSameDay(day, addDays(now, 1))) return `${t("schedule.dayTomorrow")} · ${date}`;
    return date;
  }

  if (!groups.length)
    return (
      <p className="rounded-2xl bg-surface px-5 py-10 text-center text-body-sm text-ink-tertiary">
        {t("schedule.emptyWeek")}
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ key, day, rows }) => (
        <section key={key} className="flex flex-col gap-2.5">
          <h3 className="text-caption-strong text-ink-secondary uppercase">{label(day)}</h3>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface">
            {rows.map((lesson) => {
              const look = courseLook(lesson.courseId);
              const chip = CHIP[lesson.status];
              return (
                <div
                  key={lesson.id}
                  role="button"
                  tabIndex={0}
                  className="flex min-h-[69px] cursor-pointer items-center gap-4 border-b border-line px-5 py-3 transition-colors last:border-b-0 hover:bg-subtle/50"
                  onClick={() => onSelect(lesson)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSelect(lesson);
                  }}
                >
                  <span className="flex w-16 shrink-0 flex-col">
                    <strong className="text-title text-ink">{clock(lesson.startsAt)}</strong>
                    <small className="text-body-xs text-ink-secondary">
                      {t("list.durationShort", { count: lesson.durationMinutes || 45 })}
                    </small>
                  </span>
                  <GroupTile
                    name={lesson.courseTitle}
                    tone={look.tone}
                    src={look.image}
                    className="size-10 shrink-0 rounded-[10px] text-caption-strong"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{lesson.courseTitle}</strong>
                    <small className="truncate text-body-xs text-ink-secondary">
                      {lesson.title || t("list.missingTopic")}
                    </small>
                  </span>
                  <span
                    className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-caption-strong ${chip.tone}`}
                  >
                    <Icon name={chip.icon} size={14} />
                    {t(`schedule.chip.${lesson.status}`)}
                  </span>
                  {lesson.status === "live" ? (
                    <button
                      type="button"
                      className="flex h-[42px] shrink-0 items-center gap-2 rounded-full bg-brand px-[15px] text-body-xs font-semibold text-ink-inverse transition-colors hover:bg-brand-strong"
                      onClick={(event) => {
                        event.stopPropagation();
                        onJoin(lesson);
                      }}
                    >
                      <Icon name="videocam-fill" size={18} />
                      {t("schedule.joinShort")}
                    </button>
                  ) : null}
                  <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

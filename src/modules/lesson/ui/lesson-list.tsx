import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";
import { hasLessonTopic, useLessonStatusMeta } from "../lib/lesson-status";
import { LessonActions, type LessonActionsProps } from "./lesson-actions";

export type LessonListProps = Omit<LessonActionsProps, "lesson" | "compact"> & {
  lessons: Lesson[];
};

interface DaySection {
  key: string;
  date: Date;
  lessons: Lesson[];
}

const TIME_BADGE: Record<string, string> = {
  live: "bg-error text-white",
  finished: "bg-action text-on-action",
  scheduled: "bg-saffron-strong text-white",
  cancelled: "bg-muted text-ink-secondary",
};

const STATUS_PILL: Record<string, string> = {
  live: "bg-error-bg text-error-text",
  finished: "bg-success-bg text-success-text",
  scheduled: "bg-saffron-subtle text-saffron-strong",
  cancelled: "bg-subtle text-ink-tertiary",
};

function buildSections(lessons: Lesson[]): DaySection[] {
  const byDay = groupLessonsByDay(lessons);
  const todayKey = toDayKey(new Date());
  return [...byDay.entries()]
    .sort((a, b) => {
      const aUpcoming = a[0] >= todayKey;
      const bUpcoming = b[0] >= todayKey;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
    })
    .map(([key, items]) => ({ key, date: new Date(items[0].startsAt), lessons: items }));
}

export function LessonList({ lessons, ...actions }: LessonListProps) {
  const { t } = useTranslation("lesson");
  const lessonStatusMeta = useLessonStatusMeta();
  const sections = useMemo(() => buildSections(lessons), [lessons]);
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekdays = t("list.weekdays", { returnObjects: true }) as string[];

  function dayLabel(date: Date): string {
    const stamp = `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return `${t("list.today")}, ${stamp}`;
    if (diff === -1) return `${t("list.yesterday")}, ${stamp}`;
    return `${stamp}, ${weekdays[date.getDay()] ?? ""}`;
  }

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
          <Icon name="nav-calendar" size={28} />
        </span>
        <p className="text-body-sm text-ink-secondary">{t("list.empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <h3 className="flex items-center gap-3 text-caption-strong tracking-wide text-ink-tertiary uppercase">
            {dayLabel(section.date)}
            <span className="h-px flex-1 bg-line" />
            <span className="shrink-0 normal-case">
              {t("list.dayCount", { count: section.lessons.length })}
            </span>
          </h3>

          <div className="flex flex-col gap-3">
            {section.lessons.map((lesson) => {
              const meta = lessonStatusMeta(lesson.status);
              return (
                <motion.article
                  key={lesson.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-xl ${
                        TIME_BADGE[lesson.status] ?? TIME_BADGE.scheduled
                      }`}
                    >
                      <strong className="font-numeric text-title">{lesson.time}</strong>
                      <span className="text-[11px] opacity-80">
                        {t("list.durationShort", { count: lesson.durationMinutes })}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={`inline-flex h-6 w-fit items-center rounded-full px-2.5 text-caption-strong ${
                          STATUS_PILL[meta.tone] ?? STATUS_PILL.scheduled
                        }`}
                      >
                        {meta.label}
                      </span>
                      <h4
                        className={`truncate text-title ${
                          hasLessonTopic(lesson) ? "text-ink" : "text-ink-tertiary italic"
                        }`}
                      >
                        {hasLessonTopic(lesson) ? lesson.title : t("list.missingTopic")}
                      </h4>
                      <p className="flex items-center gap-1.5 text-body-sm text-ink-tertiary">
                        <Icon name="clock" size={15} /> {lesson.time} —{" "}
                        {t("list.durationShort", { count: lesson.durationMinutes })}
                      </p>
                    </div>
                  </div>

                  <LessonActions lesson={lesson} {...actions} />
                </motion.article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

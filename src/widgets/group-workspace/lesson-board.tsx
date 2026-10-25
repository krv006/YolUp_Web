import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { Lesson, LessonStatus } from "@/shared/types";

export interface LessonBoardProps {
  lessons: Lesson[];
  studentCount: number;
  joinedCount?: number | null;
  onAdd: () => void;
  onJoin: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onCancel: (lesson: Lesson) => void;
  onRecording: (lesson: Lesson) => void;
  onRatings: (lesson: Lesson) => void;
}

const BLOCK_TONE: Record<LessonStatus, string> = {
  live: "bg-danger text-ink-inverse",
  scheduled: "bg-ink-tertiary text-ink-inverse",
  finished: "bg-line-strong text-ink-inverse",
  cancelled: "bg-line-strong text-ink-inverse",
};

const PILL_TONE: Record<LessonStatus, string> = {
  live: "bg-danger-bg px-2.5 text-danger",
  scheduled: "text-ink-tertiary",
  finished: "bg-subtle px-2.5 text-ink-secondary",
  cancelled: "bg-subtle px-2.5 text-ink-tertiary",
};

const PILL_ICON: Record<LessonStatus, string> = {
  live: "videocam",
  scheduled: "schedule",
  finished: "check-circle",
  cancelled: "cancel",
};

const OUTLINE_BUTTON =
  "flex h-11 items-center justify-center gap-1.5 rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle";

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function LessonBoard({
  lessons,
  studentCount,
  joinedCount,
  onAdd,
  onJoin,
  onEdit,
  onCancel,
  onRecording,
  onRatings,
}: LessonBoardProps) {
  const { t } = useTranslation(["group", "lesson"]);
  const months = t("lesson:list.months", { returnObjects: true }) as string[];

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const date = new Date(lesson.startsAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(lesson);
      else buckets.set(key, [lesson]);
    }

    return [...buckets.values()]
      .map((items) => {
        const sorted = [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        const date = new Date(sorted[0].startsAt);
        date.setHours(0, 0, 0, 0);
        const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
        const short = `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
        return {
          key: date.toISOString(),
          time: date.getTime(),
          label:
            diff === 0
              ? t("group:lessons.today", { date: short })
              : diff === -1
                ? t("group:lessons.yesterday", { date: short })
                : short,
          items: sorted,
        };
      })
      .sort((a, b) => b.time - a.time);
  }, [lessons, months, t]);

  if (!days.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-surface px-6 py-7 text-center">
        <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="schedule" size={32} />
        </span>
        <span className="flex flex-col gap-2">
          <strong className="font-heading text-h2 text-ink">
            {t("group:lessons.emptyTitle")}
          </strong>
          <p className="max-w-70 text-body-sm text-ink-secondary">
            {t("group:lessons.emptyHint")}
          </p>
        </span>
        <button
          type="button"
          className="flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
          onClick={onAdd}
        >
          <Icon name="add" size={18} />
          {t("group:lessons.addLesson")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {days.map((day) => (
        <section key={day.key} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-overline text-ink-tertiary uppercase">
              {day.label}
            </span>
            <small className="shrink-0 text-caption text-ink-tertiary">
              {t("group:lessons.countShort", { count: day.items.length })}
            </small>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {day.items.map((lesson) => {
              const starts = new Date(lesson.startsAt);
              const minutes = lesson.durationMinutes || 45;
              const ends = new Date(starts.getTime() + minutes * 60_000);
              const status = lesson.status;

              return (
                <article key={lesson.id} className="flex flex-col gap-3.5 rounded-lg bg-surface px-4 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg ${BLOCK_TONE[status]}`}
                    >
                      <strong className="text-title-sm">{hhmm(starts)}</strong>
                      <small className="text-micro opacity-90">
                        {t("group:lessons.minutesShort", { count: minutes })}
                      </small>
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={`flex h-5.5 w-fit items-center gap-1 rounded-full text-caption-strong ${PILL_TONE[status]}`}
                      >
                        <Icon name={PILL_ICON[status]} size={14} />
                        {t(`lesson:status.${status}`)}
                      </span>

                      <strong className="truncate text-title text-ink">
                        {lesson.title || t("group:lessons.noTopic")}
                      </strong>

                      <small className="truncate text-body-xs text-ink-tertiary">
                        {status === "live" && typeof joinedCount === "number"
                          ? t("group:lessons.joined", {
                              joined: joinedCount,
                              total: studentCount,
                            })
                          : status === "finished"
                            ? t("group:lessons.finishedMeta", { count: studentCount })
                            : `${hhmm(starts)} – ${hhmm(ends)}`}
                      </small>
                    </span>
                  </div>

                  {status === "live" ? (
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                      onClick={() => onJoin(lesson)}
                    >
                      <Icon name="videocam" size={18} />
                      {t("group:lessons.join")}
                    </button>
                  ) : status === "finished" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={OUTLINE_BUTTON}
                        onClick={() => onRecording(lesson)}
                      >
                        <Icon name="play-circle" size={18} />
                        {t("group:lessons.recording")}
                      </button>
                      <button
                        type="button"
                        className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand-subtle text-button text-brand-strong transition-colors hover:bg-tint"
                        onClick={() => onRatings(lesson)}
                      >
                        <Icon name="star" size={18} />
                        {lesson.avgRating
                          ? t("group:lessons.ratingsWith", {
                              value: lesson.avgRating.toFixed(1).replace(".", ","),
                            })
                          : t("group:lessons.ratings")}
                      </button>
                    </div>
                  ) : status === "cancelled" ? null : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={OUTLINE_BUTTON}
                        onClick={() => onEdit(lesson)}
                      >
                        <Icon name="edit" size={18} />
                        {t("group:lessons.edit")}
                      </button>
                      <button
                        type="button"
                        className={OUTLINE_BUTTON}
                        onClick={() => onCancel(lesson)}
                      >
                        <Icon name="close" size={18} />
                        {t("group:lessons.cancelLesson")}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

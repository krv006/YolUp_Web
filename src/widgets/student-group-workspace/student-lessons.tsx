import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RateLessonDialog, useLessonReminder } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { Lesson, LessonStatus } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { PanelHeading } from "@/widgets/group-workspace";

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 30;

const TILE: Record<LessonStatus, string> = {
  live: "bg-error-text",
  scheduled: "bg-ink-secondary",
  finished: "bg-line-strong",
  cancelled: "bg-line-strong",
};

const CHIP: Record<LessonStatus, string> = {
  live: "bg-danger-bg px-2 text-error-text",
  scheduled: "text-ink-secondary",
  finished: "bg-subtle px-2 text-ink-secondary",
  cancelled: "bg-subtle px-2 text-ink-secondary",
};

const CHIP_ICON: Record<LessonStatus, string> = {
  live: "videocam-fill",
  scheduled: "schedule",
  finished: "check-circle",
  cancelled: "cancel",
};

const OUTLINE =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle";

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export interface StudentLessonsProps {
  lessons?: Lesson[];
  loading: boolean;
  currentUserId?: string;
  teacher?: string;
}

export function StudentLessons({ lessons = [], loading, currentUserId, teacher = "" }: StudentLessonsProps) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { t: tl } = useTranslation("lesson");
  const navigate = useNavigate();
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [now] = useState(() => Date.now());
  const reminder = useLessonReminder();

  function toggleReminder(lesson: Lesson) {
    const enabled = !lesson.hasReminder;
    reminder.mutate(
      { id: lesson.id, enabled },
      {
        onSuccess: (minutes) =>
          toast.success(
            enabled
              ? tl("schedule.reminderSet", { count: minutes ?? 15 })
              : tl("schedule.reminderCleared")
          ),
      }
    );
  }

  const visible = useMemo(
    () =>
      lessons
        .filter((lesson) => lesson.status !== "cancelled" && new Date(lesson.startsAt).getTime() > now - HISTORY_DAYS * DAY_MS)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [lessons, now]
  );

  function dateLabel(start: Date): string {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const day = new Date(start);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / DAY_MS);
    const short = `${start.getDate()}-${(months[start.getMonth()] ?? "").toLowerCase()}`;
    if (diff === 0) return t("groupWorkspace.lessonsTab.today", { date: short });
    if (diff === -1) return t("groupWorkspace.lessonsTab.yesterday", { date: short });
    if (diff === 1) return t("groupWorkspace.lessonsTab.tomorrow", { date: short });
    return short;
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5 lg:pb-7">
      <PanelHeading
        eyebrow={t("groupWorkspace.lessonsTab.eyebrow")}
        title={t("groupWorkspace.lessonsTab.title")}
        subtitle={t("groupWorkspace.lessonsTab.subtitle")}
        className="shrink-0"
      />

      {loading && !lessons.length ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <span key={index} className="flex flex-col gap-5 rounded-xl bg-surface p-4 lg:h-[106px] lg:flex-row lg:items-center lg:gap-3 lg:py-0">
              <span className="flex h-14 items-start gap-3 lg:h-auto">
                <i className="size-14 shrink-0 rounded-[14px] bg-skeleton" />
                <span className="flex flex-col gap-2.5">
                  <i className="h-3.5 w-[90px] rounded-full bg-skeleton" />
                  <i className="h-4 w-[170px] rounded-full bg-skeleton" />
                  <i className="h-3 w-30 rounded-full bg-skeleton" />
                </span>
              </span>
              <span className="grid grid-cols-2 gap-2 lg:ml-auto lg:flex">
                <i className="h-11 rounded-full bg-skeleton lg:w-[130px]" />
                <i className="h-11 rounded-full bg-skeleton lg:w-[130px]" />
              </span>
            </span>
          ))}
        </div>
      ) : visible.length ? (
        <div className="flex flex-col gap-3">
          {visible.map((lesson) => {
            const start = new Date(lesson.startsAt);
            const minutes = lesson.durationMinutes || 45;
            const end = new Date(start.getTime() + minutes * 60_000);
            const status = lesson.status;
            const attended = lesson.attended === true;
            const meta =
              status === "finished"
                ? t(attended ? "groupWorkspace.lessonsTab.attended" : "groupWorkspace.lessonsTab.missed")
                : status === "live"
                  ? teacher
                  : `${hhmm(start)} – ${hhmm(end)}`;
            return (
              <article
                key={lesson.id}
                className="flex flex-col gap-4 rounded-xl bg-surface p-4 lg:min-h-[106px] lg:flex-row lg:items-center lg:gap-3 lg:rounded-2xl lg:py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-[14px] text-ink-inverse ${TILE[status]}`}
                  >
                    <strong className="text-title-sm leading-5 font-semibold">{hhmm(start)}</strong>
                    <small className="text-caption font-medium opacity-90">
                      {t("groupWorkspace.lessonsTab.minutes", { count: minutes })}
                    </small>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className={`flex h-[22px] items-center gap-1 rounded-full text-caption-strong ${CHIP[status]}`}>
                      <Icon name={CHIP_ICON[status]} size={14} />
                      {tl(`status.${status}`)}
                    </span>
                    <strong className="max-w-full truncate text-[17px]/[22px] font-semibold text-ink">
                      {lesson.title || t("groupWorkspace.lessonsTab.noTopic")}
                    </strong>
                    <small className="max-w-full truncate text-body-sm text-ink-secondary">
                      {[dateLabel(start), meta].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                </div>

                {status === "live" ? (
                  <button
                    type="button"
                    className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-4 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                    onClick={() => navigate(ROUTES.live(lesson.id))}
                  >
                    <Icon name="videocam-fill" size={18} />
                    {t("groupWorkspace.lessonsTab.join")}
                  </button>
                ) : status === "finished" ? (
                  <div className="grid shrink-0 grid-cols-2 gap-2 lg:flex">
                    <button type="button" className={OUTLINE} onClick={() => navigate(ROUTES.student.recording(lesson.id))}>
                      <Icon name="play-circle-fill" size={18} />
                      {t("groupWorkspace.lessonsTab.video")}
                    </button>
                    <button
                      type="button"
                      className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-subtle px-4 text-button text-brand transition-colors hover:bg-brand-subtle/70"
                      onClick={() => setRateTarget(lesson)}
                    >
                      <Icon name="star" size={18} />
                      {lesson.myRating
                        ? t("groupWorkspace.lessonsTab.myRating", { value: lesson.myRating })
                        : t("groupWorkspace.lessonsTab.rate")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={
                      lesson.hasReminder
                        ? "flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-subtle px-4 text-button text-brand transition-colors hover:bg-tint"
                        : `${OUTLINE} shrink-0`
                    }
                    aria-pressed={lesson.hasReminder}
                    disabled={reminder.isPending && reminder.variables?.id === lesson.id}
                    onClick={() => toggleReminder(lesson)}
                  >
                    <Icon name={lesson.hasReminder ? "notifications-off" : "notifications"} size={18} />
                    {lesson.hasReminder
                      ? tl("schedule.reminderOn", { count: lesson.reminderMinutes ?? 15 })
                      : t("groupWorkspace.lessonsTab.remind")}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <MobileEmptyCard
          icon="schedule"
          title={t("groupWorkspace.lessonsTab.emptyTitle")}
          description={t("groupWorkspace.lessonsTab.emptyHint")}
        />
      )}

      <RateLessonDialog
        lesson={rateTarget}
        currentUserId={currentUserId}
        onOpenChange={(open) => {
          if (!open) setRateTarget(null);
        }}
      />
    </div>
  );
}

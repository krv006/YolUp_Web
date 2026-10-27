import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { Lesson } from "@/shared/types";

export interface LessonDetailDrawerProps {
  lesson: Lesson | null;
  studentCount: number;
  now: Date;
  onOpenChange: (open: boolean) => void;
  onChat: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
  onRatings: (lesson: Lesson) => void;
  onCancel: (lesson: Lesson) => void;
}

function clock(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function LessonDetailDrawer({
  lesson,
  studentCount,
  now,
  onOpenChange,
  onChat,
  onJoin,
  onRatings,
  onCancel,
}: LessonDetailDrawerProps) {
  const { t } = useTranslation("lesson");
  const months = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysShort = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();

  if (!lesson) return null;

  const starts = new Date(lesson.startsAt);
  const ends = new Date(starts.getTime() + (lesson.durationMinutes || 45) * 60_000);
  const minutes = Math.round((starts.getTime() - now.getTime()) / 60_000);
  const today = starts.toDateString() === now.toDateString();
  const live = lesson.status === "live";
  const finished = lesson.status === "finished";

  const timeValue = `${today ? `${t("schedule.today")}, ` : `${starts.getDate()}-${months[starts.getMonth()]}, `}${clock(starts)} – ${clock(ends)} · ${t("list.durationMinutes", { count: lesson.durationMinutes || 45 })}`;
  const statusLabel = live
    ? t("schedule.live")
    : minutes >= 0
      ? t("schedule.startsIn", { count: minutes })
      : t(`status.${lesson.status}`);

  if (isCompact) {
    const repeatValue = lesson.recurrence
      ? [
          lesson.recurrence.weekdays
            .map((day) => weekdaysShort[day] ?? "")
            .filter(Boolean)
            .join(", "),
          t(`schedule.rows.freq.${lesson.recurrence.freq}`, { defaultValue: t("schedule.rows.repeatValue") }),
        ]
          .filter(Boolean)
          .join(" — ")
      : t("schedule.rows.repeatValue");

    return (
      <AppDialog
        open
        onOpenChange={onOpenChange}
        variant="adaptive"
        title={lesson.courseTitle}
        description={t("schedule.detailTitle")}
        footerClassName="px-4 pt-6 pb-7"
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`}
              onClick={() => onChat(lesson)}
            >
              {t("schedule.openChat")}
            </button>
            <button
              type="button"
              className={`${dialogButton.primary} h-13 text-title font-semibold`}
              onClick={() => onJoin(lesson)}
            >
              {t("schedule.join")}
            </button>
          </div>
        }
      >
        <div className="-mt-0.5 flex flex-col gap-4">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 text-caption-strong ${
                live ? "bg-danger-bg text-error-text" : finished ? "bg-success-bg text-success-fg" : "bg-accent-teal-bg text-accent-teal-fg"
              }`}
            >
              <Icon name="schedule" size={14} />
              {statusLabel}
            </span>
            {lesson.quizId ? (
              <span className="flex h-6 items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 text-caption-strong text-brand">
                <Icon name="quiz" size={14} />
                {t("schedule.quizAttached")}
              </span>
            ) : null}
          </span>

          <MobileRow icon="schedule" label={t("schedule.rows.time")} value={timeValue} />
          {lesson.recurrence || lesson.recurrenceId ? (
            <MobileRow icon="refresh" label={t("schedule.rows.repeat")} value={repeatValue} />
          ) : null}
          <MobileRow icon="quiz" label={t("schedule.rows.topic")} value={lesson.title || t("list.missingTopic")} />
          {lesson.note ? (
            <MobileRow icon="assign" label={t("schedule.rows.homework")} value={lesson.note} />
          ) : null}
          <MobileRow
            icon="person"
            label={t("schedule.rows.students")}
            value={t("schedule.students", { count: studentCount })}
          />

          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-button text-ink"
              onClick={() => (finished ? onRatings(lesson) : onChat(lesson))}
            >
              <Icon name={finished ? "star" : "edit"} size={18} />
              {finished ? t("schedule.ratings") : t("schedule.edit")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-danger-bg text-button text-danger disabled:opacity-50"
              disabled={finished}
              onClick={() => onCancel(lesson)}
            >
              <Icon name="close" size={18} />
              {t("schedule.cancel")}
            </button>
          </div>
        </div>
      </AppDialog>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-110 flex-col gap-5 bg-surface px-6 py-6 text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex shrink-0 items-start gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogPrimitive.Title className="truncate font-heading text-h1 text-ink">
                {lesson.courseTitle}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-body-xs text-ink-tertiary">
                {t("schedule.detailTitle")}
              </DialogPrimitive.Description>
            </span>
            <DialogPrimitive.Close
              className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
              aria-label={t("schedule.close")}
            >
              <Icon name="close" size={18} />
            </DialogPrimitive.Close>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-warning-bg px-3 text-caption-strong text-warning-fg">
              <Icon name="schedule" size={13} />
              {live
                ? t("schedule.live")
                : minutes >= 0
                  ? t("schedule.startsIn", { count: minutes })
                  : t(`status.${lesson.status}`)}
            </span>
            {lesson.quizId ? (
              <span className="flex h-7 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand">
                <Icon name="quiz" size={13} />
                {t("schedule.quizAttached")}
              </span>
            ) : null}
          </div>

          <dl className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <Row
              icon="schedule"
              label={t("schedule.rows.time")}
              value={`${today ? `${t("schedule.today")}, ` : `${starts.getDate()}-${months[starts.getMonth()]}, `}${clock(starts)} – ${clock(ends)} · ${t("list.durationMinutes", { count: lesson.durationMinutes || 45 })}`}
            />
            {lesson.recurrence || lesson.recurrenceId ? (
              <Row
                icon="refresh"
                label={t("schedule.rows.repeat")}
                value={
                  lesson.recurrence
                    ? [
                        lesson.recurrence.weekdays
                          .map((day) => weekdaysShort[day] ?? "")
                          .filter(Boolean)
                          .join(", "),
                        t(`schedule.rows.freq.${lesson.recurrence.freq}`, {
                          defaultValue: t("schedule.rows.repeatValue"),
                        }),
                        lesson.recurrence.endsOn
                          ? t("schedule.rows.until", { date: lesson.recurrence.endsOn })
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : t("schedule.rows.repeatValue")
                }
              />
            ) : null}
            <Row
              icon="quiz"
              label={t("schedule.rows.topic")}
              value={lesson.title || t("list.missingTopic")}
            />
            {lesson.note ? (
              <Row icon="assignment" label={t("schedule.rows.homework")} value={lesson.note} />
            ) : null}
            <Row
              icon="person"
              label={t("schedule.rows.students")}
              value={t("schedule.students", { count: studentCount })}
            />
          </dl>

          <div className="flex shrink-0 flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
                onClick={() => (finished ? onRatings(lesson) : onChat(lesson))}
              >
                <Icon name={finished ? "star" : "edit"} size={18} />
                {finished ? t("schedule.ratings") : t("schedule.edit")}
              </button>
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-danger-bg text-button text-danger transition-opacity hover:opacity-85"
                onClick={() => onCancel(lesson)}
              >
                <Icon name="close" size={18} />
                {t("schedule.cancel")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex h-12 items-center justify-center rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
                onClick={() => onChat(lesson)}
              >
                {t("schedule.openChat")}
              </button>
              <button
                type="button"
                className="flex h-12 items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                onClick={() => onJoin(lesson)}
              >
                {t("schedule.join")}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-subtle text-icon-secondary">
        <Icon name={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <dt className="truncate text-body-xs text-ink-tertiary">{label}</dt>
        <dd className="text-title-sm text-ink">{value}</dd>
      </span>
    </span>
  );
}

function MobileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="truncate text-caption text-ink-secondary">{label}</small>
        <strong className="text-body-sm font-semibold text-ink">{value}</strong>
      </span>
    </span>
  );
}

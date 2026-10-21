import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Lesson } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useCourses } from "@/modules/course";
import { useCancelLesson } from "../model/lesson.queries";

export interface LessonDetailDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onAttendance: (lesson: Lesson) => void;
  onHomework: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
}

const ACTION =
  "flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle";

export function LessonDetailDialog({
  lesson,
  open,
  onOpenChange,
  canManage,
  onAttendance,
  onHomework,
  onEdit,
  onRate,
}: LessonDetailDialogProps) {
  const { t } = useTranslation("lesson");
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scope, setScope] = useState<"one" | "series">("one");
  const cancelLesson = useCancelLesson();
  const courses = useCourses();

  if (!lesson) return null;

  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  const weekdayIndex = (start.getDay() + 6) % 7;
  const timeRange = `${lesson.time} – ${String(end.getHours()).padStart(2, "0")}:${String(
    end.getMinutes()
  ).padStart(2, "0")}`;

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        title={lesson.courseTitle}
        description={t("schedule.detailTitle")}
      >
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5 text-body-sm text-ink">
            <Icon name="nav-calendar" size={18} className="shrink-0 text-ink-secondary" />
            {weekdaysLong?.[weekdayIndex] ?? ""}, {start.getDate()}-
            {(months[start.getMonth()] ?? "").toLowerCase()}
          </span>
          <span className="flex items-center gap-2.5 text-body-sm text-ink">
            <Icon name="clock" size={18} className="shrink-0 text-ink-secondary" />
            {timeRange}
          </span>
          <span className="flex items-center gap-2.5 text-body-sm text-ink">
            <Icon name="groups" size={18} className="shrink-0 text-ink-secondary" />
            {lesson.courseTitle}
            {(() => {
              const course = (courses.data ?? []).find((item) => item.id === lesson.courseId);
              return course?.studentCount
                ? ` · ${t("schedule.memberCount", { count: course.studentCount })}`
                : "";
            })()}
          </span>
          {lesson.topic ? (
            <span className="flex items-center gap-2.5 text-body-sm text-ink">
              <Icon name="assign" size={18} className="shrink-0 text-ink-secondary" />
              {lesson.topic}
            </span>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
              onClick={() => onAttendance(lesson)}
            >
              <Icon name="check-circle" size={18} /> {t("schedule.attendance")}
            </button>
            <button type="button" className={ACTION} onClick={() => onHomework(lesson)}>
              <Icon name="assign" size={18} /> {t("schedule.homework")}
            </button>
            {canManage ? (
              <button type="button" className={ACTION} onClick={() => onEdit(lesson)}>
                <Icon name="edit" size={18} /> {t("schedule.edit")}
              </button>
            ) : null}
            {!canManage && onRate && lesson.status === "finished" ? (
              <button type="button" className={ACTION} onClick={() => onRate(lesson)}>
                <Icon name="check-circle" size={18} /> {t("rateDialog.title")}
              </button>
            ) : null}
          </div>

          {canManage ? (
            <button
              type="button"
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full text-label-strong text-error-text transition-colors hover:bg-error-bg"
              onClick={() => setConfirmOpen(true)}
            >
              <Icon name="trash" size={18} /> {t("schedule.cancelLesson")}
            </button>
          ) : null}
        </div>
      </AppDialog>

      <AppDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="confirm"
        icon={
          <span className="grid size-11 place-items-center rounded-full bg-error-bg text-error-text">
            <Icon name="trash" size={20} />
          </span>
        }
        title={t("schedule.cancelTitle")}
        description={t("schedule.cancelDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setConfirmOpen(false)}
            >
              {t("schedule.keep")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={cancelLesson.isPending}
              onClick={() =>
                cancelLesson.mutate(
                  { id: lesson.id, scope },
                  {
                    onSuccess: (count) => {
                      toast.success(t("schedule.cancelled", { count }));
                      setConfirmOpen(false);
                      onOpenChange(false);
                    },
                  }
                )
              }
            >
              {t("schedule.cancelConfirm")}
            </button>
          </>
        }
      >
        {lesson.recurrenceId ? (
            <div className="flex flex-col gap-2" role="radiogroup">
              {(["one", "series"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={scope === item}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    scope === item ? "border-action bg-action-subtle" : "border-line bg-surface"
                  }`}
                  onClick={() => setScope(item)}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                      scope === item ? "border-action" : "border-line"
                    }`}
                  >
                    {scope === item ? <span className="size-2.5 rounded-full bg-action" /> : null}
                  </span>
                  <span className="text-label-strong text-ink">
                    {t(`schedule.cancelScope.${item}`)}
                  </span>
                </button>
              ))}
            </div>
        ) : null}
      </AppDialog>
    </>
  );
}

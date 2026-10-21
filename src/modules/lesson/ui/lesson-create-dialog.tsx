import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourses } from "@/modules/course";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, DurationPicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { useCreateLesson, useUpdateLesson } from "../model/lesson.queries";
import type { Lesson } from "@/shared/types";

export interface LessonCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  lesson?: Lesson | null;
}

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function LessonCreateDialog({ open, onOpenChange, date, lesson }: LessonCreateDialogProps) {
  const { t } = useTranslation("lesson");
  const courses = useCourses();
  const create = useCreateLesson();
  const update = useUpdateLesson();

  const [courseId, setCourseId] = useState("");
  const [day, setDay] = useState(() => toDateValue(date));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(45);
  const [repeat, setRepeat] = useState<"once" | "weekly">("once");
  const [weeks, setWeeks] = useState(8);
  const [note, setNote] = useState("");

  const formKey = open ? `${lesson?.id ?? "new"}|${toDateValue(date)}` : "";
  const [syncedKey, setSyncedKey] = useState("");

  if (formKey && formKey !== syncedKey) {
    const start = lesson ? new Date(lesson.startsAt) : date;
    setSyncedKey(formKey);
    setCourseId(lesson?.courseId ?? "");
    setDay(toDateValue(start));
    setTime(
      lesson
        ? `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
        : "10:00"
    );
    setDuration(lesson?.durationMinutes || 45);
    setNote(lesson?.topic ?? "");
    setRepeat("once");
  }
  if (!formKey && syncedKey) setSyncedKey("");

  const options = (courses.data ?? []).map((course) => ({
    value: course.id,
    label: course.title,
  }));
  const pending = create.isPending || update.isPending;

  async function save() {
    if (!courseId) {
      toast.error(t("schedule.selectGroup"));
      return;
    }
    try {
      if (lesson) {
        await update.mutateAsync({
          id: lesson.id,
          form: { courseId, topic: note, date: day, time, duration },
        });
      } else if (repeat === "weekly") {
        const start = new Date(`${day}T${time}`);
        await create.mutateAsync({
          courseId,
          topic: note,
          date: day,
          time,
          duration,
          recurrence: {
            freq: "weekly",
            weeks,
            weekdays: [(start.getDay() + 6) % 7],
          },
        });
      } else {
        await create.mutateAsync({ courseId, topic: note, date: day, time, duration });
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("schedule.cancel"));
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={lesson ? t("schedule.edit") : t("schedule.newLesson")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("schedule.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending}
            onClick={save}
          >
            {t("schedule.save")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SelectPicker
          label={t("schedule.group")}
          value={courseId}
          onChange={setCourseId}
          options={options}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <DatePicker label={t("schedule.date")} value={day} onChange={setDay} />
          <TimePicker label={t("schedule.time")} value={time} onChange={setTime} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DurationPicker
            label={t("schedule.durationLabel")}
            value={String(duration)}
            onChange={(value) => setDuration(Number(value) || 45)}
          />
          {lesson ? null : (
            <SelectPicker
              label={t("schedule.repeat")}
              value={repeat}
              onChange={(value) => setRepeat(value as "once" | "weekly")}
              options={[
                { value: "once", label: t("schedule.repeatOnce") },
                { value: "weekly", label: t("schedule.repeatWeekly") },
              ]}
            />
          )}
        </div>

        {repeat === "weekly" && !lesson ? (
          <label className="field-group">
            <span>{t("schedule.weeksLabel")}</span>
            <input
              type="number"
              min={1}
              max={52}
              value={weeks}
              onChange={(event) => setWeeks(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>
        ) : null}

        <label className="field-group">
          <span>{t("schedule.note")}</span>
          <textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("schedule.notePlaceholder")}
          />
        </label>
      </div>
    </AppDialog>
  );
}

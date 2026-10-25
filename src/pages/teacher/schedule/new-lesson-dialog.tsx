import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuizzes } from "@/modules/quiz";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";

export interface NewLessonValues {
  courseId: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  quizId: string;
}

export interface NewLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; title: string }>;
  pending?: boolean;
  onSubmit: (values: NewLessonValues) => void;
}

const DURATIONS = [45, 60, 90, 120];

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function NewLessonDialog({
  open,
  onOpenChange,
  courses,
  pending = false,
  onSubmit,
}: NewLessonDialogProps) {
  const { t } = useTranslation("lesson");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [quizId, setQuizId] = useState("");
  const quizzes = useQuizzes(courseId || null, Boolean(courseId) && open);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("scheduleDialog.title")}
      description={t("scheduleDialog.description")}
      footer={
        <button
          type="button"
          className={dialogButton.primary}
          disabled={pending || !courseId || !topic.trim()}
          onClick={() =>
            onSubmit({
              courseId,
              topic: topic.trim(),
              date,
              time,
              duration: String(duration),
              quizId,
            })
          }
        >
          {t("scheduleDialog.submit")}
        </button>
      }
    >
      <div className="lesson-form flex flex-col gap-4.5">
        <SelectPicker
          label={t("scheduleDialog.group")}
          searchable
          value={courseId}
          onChange={setCourseId}
          options={courses.map((course) => ({ value: course.id, label: course.title }))}
        />

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("scheduleDialog.topic")}</span>
          <input
            autoFocus
            className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            value={topic}
            placeholder={t("scheduleDialog.topicPlaceholder")}
            onChange={(event) => setTopic(event.target.value)}
          />
        </label>

        <div className="flex w-fit items-center gap-1 rounded-full bg-subtle p-1">
          {[false, true].map((mode) => (
            <button
              key={String(mode)}
              type="button"
              className={`flex h-8 items-center rounded-full px-4 text-button transition-colors ${
                repeat === mode ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => setRepeat(mode)}
            >
              {mode ? t("scheduleDialog.repeating") : t("scheduleDialog.single")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 items-start gap-3">
          <DatePicker label={t("scheduleDialog.date")} value={date} onChange={setDate} />
          <TimePicker label={t("scheduleDialog.start")} value={time} onChange={setTime} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("scheduleDialog.duration")}</span>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`flex h-10 items-center justify-center rounded-full text-button transition-colors ${
                  duration === value
                    ? "bg-brand text-ink-inverse"
                    : "text-ink-secondary hover:bg-subtle"
                }`}
                onClick={() => setDuration(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <SelectPicker
          label={t("scheduleDialog.quiz")}
          value={quizId}
          onChange={setQuizId}
          options={[
            { value: "", label: t("scheduleDialog.noQuiz") },
            ...(quizzes.data ?? []).map((quiz) => ({ value: quiz.id, label: quiz.title })),
          ]}
        />
      </div>
    </AppDialog>
  );
}

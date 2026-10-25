import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";

export interface AssignQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tanlanadigan testlar (test oldindan aniq bo'lsa, `quizId` beriladi). */
  quizzes?: ReadonlyArray<{ id: string; label: string }>;
  /** Tanlanadigan guruhlar (guruh oldindan aniq bo'lsa, `courseId` beriladi). */
  courses?: ReadonlyArray<{ id: string; label: string }>;
  quizId?: string | null;
  quizLabel?: string;
  courseId?: string | null;
  pending?: boolean;
  onSubmit: (value: { quizId: string; courseId: string; dueAt: string | null }) => void;
}

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function AssignQuizDialog({
  open,
  onOpenChange,
  quizzes = [],
  courses = [],
  quizId = null,
  quizLabel = "",
  courseId = null,
  pending = false,
  onSubmit,
}: AssignQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const [pickedQuiz, setPickedQuiz] = useState("");
  const [pickedCourse, setPickedCourse] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("23:59");

  const finalQuiz = quizId ?? pickedQuiz;
  const finalCourse = courseId ?? pickedCourse;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("assignDialog.title")}
      description={t("assignDialog.description")}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("assignDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending || !finalQuiz || !finalCourse}
            onClick={() =>
              onSubmit({
                quizId: finalQuiz,
                courseId: finalCourse,
                dueAt: date ? `${date}T${time || "23:59"}` : null,
              })
            }
          >
            {t("assignDialog.submit")}
          </button>
        </div>
      }
    >
      <div className="lesson-form flex flex-col gap-4.5">
        {quizId ? (
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("assignDialog.quizLabel")}</span>
            <span className="flex h-12.5 items-center rounded-md bg-subtle px-4 text-body text-ink">
              {quizLabel}
            </span>
          </label>
        ) : (
          <SelectPicker
            label={t("assignDialog.quizLabel")}
            searchable
            value={pickedQuiz}
            onChange={setPickedQuiz}
            options={quizzes.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}

        {courseId ? null : (
          <SelectPicker
            label={t("assignDialog.courseLabel")}
            searchable
            value={pickedCourse}
            onChange={setPickedCourse}
            options={courses.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}

        <div className="grid grid-cols-2 items-start gap-3">
          <DatePicker label={t("assignDialog.dueLabel")} value={date} onChange={setDate} />
          <TimePicker label={t("assignDialog.timeLabel")} value={time} onChange={setTime} />
        </div>

        {quizId || quizzes.length ? null : (
          <p className="text-body-xs text-ink-tertiary">{t("assignDialog.noQuizzes")}</p>
        )}
      </div>
    </AppDialog>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { MobileFieldLabel, MobilePickerField } from "@/shared/ui/mobile-fields";

export interface AssignQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tanlanadigan testlar (test oldindan aniq bo'lsa, `quizId` beriladi). */
  quizzes?: ReadonlyArray<{ id: string; label: string }>;
  /** Tanlanadigan guruhlar (guruh oldindan aniq bo'lsa, `courseId` beriladi). */
  courses?: ReadonlyArray<{ id: string; label: string; studentCount?: number }>;
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
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const [pickedQuiz, setPickedQuiz] = useState<string | null>(null);
  const [pickedCourse, setPickedCourse] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("23:59");

  const finalQuiz = pickedQuiz ?? quizId ?? "";
  const finalCourse = courseId ?? pickedCourse;

  function changeOpen(next: boolean) {
    if (!next) setPickedQuiz(null);
    onOpenChange(next);
  }

  function submit() {
    onSubmit({
      quizId: finalQuiz,
      courseId: finalCourse,
      dueAt: date ? `${date}T${time || "23:59"}` : null,
    });
  }

  if (isCompact) {
    const quizOptions =
      quizId && !quizzes.some((item) => item.id === quizId) ? [{ id: quizId, label: quizLabel }, ...quizzes] : quizzes;
    const quiz = quizOptions.find((item) => item.id === finalQuiz) ?? null;
    const course = courses.find((item) => item.id === finalCourse) ?? null;
    const courseLabel = (item: { label: string; studentCount?: number }) =>
      item.studentCount === undefined
        ? item.label
        : `${item.label} · ${t("assignDialog.students", { count: item.studentCount })}`;
    const day = new Date(`${date}T00:00`);
    const dateLabel = Number.isNaN(day.getTime())
      ? date
      : `${day.getDate()}-${(months[day.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;

    return (
      <AppDialog
        open={open}
        onOpenChange={changeOpen}
        variant="adaptive"
        title={t("assignDialog.title")}
        description={t("assignDialog.description")}
        footerClassName="px-4 pt-6 pb-8.5"
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`}
              onClick={() => changeOpen(false)}
            >
              {t("assignDialog.cancel")}
            </button>
            <button
              type="button"
              className={`${dialogButton.primary} h-13 text-title font-semibold`}
              disabled={pending || !finalQuiz || !finalCourse}
              onClick={submit}
            >
              {t("assignDialog.submit")}
            </button>
          </div>
        }
      >
        <div className="-mt-1 flex flex-col gap-3.5">
          <MobileFieldLabel label={t("assignDialog.quizLabel")}>
            <MobilePickerField
              type="select"
              value={finalQuiz}
              display={quiz ? quiz.label : <span className="text-ink-secondary">{t("assignDialog.pick")}</span>}
              ariaLabel={t("assignDialog.quizLabel")}
              options={[
                ...(quiz ? [] : [{ value: "", label: t("assignDialog.pick") }]),
                ...quizOptions.map((item) => ({ value: item.id, label: item.label })),
              ]}
              onChange={setPickedQuiz}
            />
          </MobileFieldLabel>

          {courseId ? null : (
            <MobileFieldLabel label={t("assignDialog.courseLabel")}>
              <MobilePickerField
                type="select"
                value={finalCourse}
                display={course ? courseLabel(course) : <span className="text-ink-secondary">{t("assignDialog.pick")}</span>}
                ariaLabel={t("assignDialog.courseLabel")}
                options={[
                  ...(course ? [] : [{ value: "", label: t("assignDialog.pick") }]),
                  ...courses.map((item) => ({ value: item.id, label: courseLabel(item) })),
                ]}
                onChange={setPickedCourse}
              />
            </MobileFieldLabel>
          )}

          <div className="grid grid-cols-2 gap-3">
            <MobileFieldLabel label={t("assignDialog.dueLabel")}>
              <MobilePickerField
                type="date"
                value={date}
                display={dateLabel}
                min={today()}
                ariaLabel={t("assignDialog.dueLabel")}
                onChange={setDate}
              />
            </MobileFieldLabel>
            <MobileFieldLabel label={t("assignDialog.timeLabel")}>
              <MobilePickerField
                type="time"
                value={time}
                display={time}
                ariaLabel={t("assignDialog.timeLabel")}
                onChange={setTime}
              />
            </MobileFieldLabel>
          </div>
        </div>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={changeOpen}
      variant="confirm"
      title={t("assignDialog.title")}
      description={t("assignDialog.description")}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => changeOpen(false)}
          >
            {t("assignDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending || !finalQuiz || !finalCourse}
            onClick={submit}
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
            value={finalQuiz}
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

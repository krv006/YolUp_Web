import { useState } from "react";
import { BookOpen, FileQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

export interface AssignQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tanlanadigan testlar (test oldindan aniq bo'lsa, `quizId` beriladi). */
  quizzes?: ReadonlyArray<{ id: string; label: string }>;
  /** Tanlanadigan guruhlar (guruh oldindan aniq bo'lsa, `courseId` beriladi). */
  courses?: ReadonlyArray<{ id: string; label: string }>;
  quizId?: string | null;
  courseId?: string | null;
  pending?: boolean;
  onSubmit: (value: { quizId: string; courseId: string }) => void;
}

/**
 * Guruhsiz (masalan, AI yaratgan) testni guruhga berish: test yoki guruh oldindan aniq bo'lishi mumkin,
 * qolganini o'qituvchi tanlaydi. Qoralama test guruhga berilgach ham o'quvchiga ko'rinmaydi — e'lon qilinguncha.
 */
export function AssignQuizDialog(props: AssignQuizDialogProps) {
  const { t } = useTranslation("quiz");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? (
        <DialogContent title={t("assignDialog.title")} description={t("assignDialog.description")}>
          <AssignQuizForm {...props} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function AssignQuizForm({
  onOpenChange,
  quizzes = [],
  courses = [],
  quizId = null,
  courseId = null,
  pending = false,
  onSubmit,
}: AssignQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const [pickedQuiz, setPickedQuiz] = useState("");
  const [pickedCourse, setPickedCourse] = useState("");
  const finalQuiz = quizId ?? pickedQuiz;
  const finalCourse = courseId ?? pickedCourse;

  return (
    <>
      <div className="group-action-form">
        {quizId ? null : (
          <SelectPicker
            label={t("assignDialog.quizLabel")}
            icon={FileQuestion}
            searchable
            value={pickedQuiz}
            onChange={setPickedQuiz}
            options={quizzes.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}
        {courseId ? null : (
          <SelectPicker
            label={t("assignDialog.courseLabel")}
            icon={BookOpen}
            searchable
            value={pickedCourse}
            onChange={setPickedCourse}
            options={courses.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}
        {quizId || quizzes.length ? null : <p className="ai-quiz-hint">{t("assignDialog.noQuizzes")}</p>}
        <p className="ai-quiz-hint">{t("assignDialog.draftHint")}</p>
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {t("assignDialog.cancel")}
        </Button>
        <Button
          loading={pending}
          disabled={!finalQuiz || !finalCourse}
          onClick={() => onSubmit({ quizId: finalQuiz, courseId: finalCourse })}
        >
          {t("assignDialog.submit")}
        </Button>
      </div>
    </>
  );
}

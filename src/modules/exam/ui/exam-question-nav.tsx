import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuizAnswerValue, QuizQuestion } from "@/shared/types";

export interface ExamQuestionNavProps {
  questions: QuizQuestion[];
  answers: Record<string, QuizAnswerValue>;
  flagged: ReadonlySet<string>;
  onJump: (questionId: string) => void;
}

/** Savollar paneli (haqiqiy kompyuter IELTS dagidek): raqamli tugmalar — javob berilgan / belgilangan / javobsiz. */
export function ExamQuestionNav({ questions, answers, flagged, onJump }: ExamQuestionNavProps) {
  const { t } = useTranslation("exam");
  if (questions.length < 2) return null;
  return (
    <nav className="exam-qnav" aria-label={t("runner.navAria")}>
      {questions.map((question) => {
        const done = Boolean(answers[question.id]);
        const marked = flagged.has(question.id);
        return (
          <button
            key={question.id}
            type="button"
            className={`${done ? "is-done" : ""} ${marked ? "is-flagged" : ""}`}
            title={t("runner.questionNumber", { number: question.order + 1 })}
            onClick={() => onJump(question.id)}
          >
            {question.order + 1}
            {marked ? <Flag size={9} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </nav>
  );
}

import { useTranslation } from "react-i18next";
import { useExamStudentResult } from "../model/exam.queries";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
}

/** Qo'lda baholanadigan bo'limlardagi (IELTS Writing) yozma javoblar — o'qituvchi o'qib, ball kiritadi. */
export function ExamWritingReview({ examId, studentId }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const detail = useExamStudentResult(examId, studentId);

  if (detail.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (!detail.data) return null;

  const answers = detail.data.manualAnswers;

  return (
    <div className="exam-writing-review">
      <div className="exam-writing-answers">
        <span className="exam-writing-head">{t("writing.essays")}</span>
        {answers.length ? (
          answers.map((answer, index) => (
            <article key={`${answer.section}-${index}`}>
              <small>{answer.question}</small>
              <p>{answer.answer}</p>
            </article>
          ))
        ) : (
          <small>{t("writing.empty")}</small>
        )}
      </div>
    </div>
  );
}

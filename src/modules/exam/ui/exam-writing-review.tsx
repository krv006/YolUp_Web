import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/legacy";
import { useExamStudentResult, useRequestWritingAi } from "../model/exam.queries";
import { ExamWritingAiPanel } from "./exam-writing-ai";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
  /** Taklif etilgan bandni o'qituvchi ball maydoniga qo'yadi. */
  onApplyBand?: (band: number) => void;
}

/** Qo'lda baholanadigan bo'limlardagi (IELTS Writing) yozma javoblar + AI tahlili — o'qituvchi o'qib, ball kiritadi. */
export function ExamWritingReview({ examId, studentId, onApplyBand }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const detail = useExamStudentResult(examId, studentId);
  const ask = useRequestWritingAi(examId);

  if (detail.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (!detail.data) return null;

  const answers = detail.data.manualAnswers;
  const ai = detail.data.writingAi;
  const canAsk = answers.some((answer) => answer.answer.trim()) && ai?.status !== "queued";

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

      {canAsk ? (
        <Button size="sm" variant="secondary" loading={ask.isPending} onClick={() => ask.mutate(studentId)}>
          <Sparkles size={15} /> {ai?.status === "done" ? t("writingAi.again") : t("writingAi.ask")}
        </Button>
      ) : null}
      {ai ? <ExamWritingAiPanel ai={ai} onApply={onApplyBand} /> : null}
    </div>
  );
}

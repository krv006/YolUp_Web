import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useExamStudentResult, useRequestWritingAi } from "../model/exam.queries";
import { ExamWritingAiPanel } from "./exam-writing-ai";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
  /** Taklif etilgan bandni o'qituvchi ball maydoniga qo'yadi. */
  onApplyBand?: (band: number) => void;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Qo'lda baholanadigan bo'limlardagi (IELTS Writing) yozma javoblar + AI tahlili. */
export function ExamWritingReview({ examId, studentId, onApplyBand }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const detail = useExamStudentResult(examId, studentId);
  const ask = useRequestWritingAi(examId);

  if (detail.isLoading)
    return <p className="text-body-sm text-ink-tertiary">{t("result.loading")}</p>;
  if (!detail.data) return null;

  const answers = detail.data.manualAnswers;
  const ai = detail.data.writingAi;
  const canAsk = answers.some((answer) => answer.answer.trim()) && ai?.status !== "queued";

  return (
    <div className="flex flex-col gap-4">
      {canAsk ? (
        <button
          type="button"
          className="flex h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50"
          disabled={ask.isPending}
          onClick={() => ask.mutate(studentId)}
        >
          <Sparkles size={16} />
          {ai?.status === "done" ? t("writingAi.again") : t("writingAi.ask")}
        </button>
      ) : null}

      {ai ? <ExamWritingAiPanel ai={ai} onApply={onApplyBand} /> : null}

      {answers.length ? (
        answers.map((answer, index) => (
          <article
            key={`${answer.section}-${index}`}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <div className="flex items-baseline gap-3">
              <strong className="flex-1 truncate text-title text-ink">
                {t("mock.taskNumber", { number: index + 1 })}
              </strong>
              <small className="shrink-0 font-numeric text-caption text-ink-tertiary">
                {t("mock.wordCount", { count: countWords(answer.answer) })}
              </small>
            </div>

            {answer.question ? (
              <p className="rounded-xl bg-subtle px-4 py-3 text-body-sm text-ink-secondary">
                {answer.question}
              </p>
            ) : null}

            <p className="text-body text-ink">{answer.answer || t("writing.empty")}</p>
          </article>
        ))
      ) : (
        <p className="text-body-sm text-ink-tertiary">{t("mock.noEssays")}</p>
      )}
    </div>
  );
}

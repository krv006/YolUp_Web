import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MathText } from "@/modules/quiz";
import { useExamStudentResult } from "../model/exam.queries";

export interface ExamReviewProps {
  examId: string;
  studentId: string;
}

/** Savol-savol tahlil: o'quvchi nima yozgan, to'g'ri javob nima. Bo'limlar bo'yicha guruhlanadi. */
export function ExamReview({ examId, studentId }: ExamReviewProps) {
  const { t } = useTranslation("exam");
  const detail = useExamStudentResult(examId, studentId);

  if (detail.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  const rows = detail.data?.review ?? [];
  if (!rows.length) return <p className="exam-result-loading">{t("review.empty")}</p>;

  const sections: Array<{ key: string; title: string; rows: typeof rows }> = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.key === row.section) last.rows.push(row);
    else sections.push({ key: row.section, title: row.sectionTitle, rows: [row] });
  }

  return (
    <div className="exam-review">
      {sections.map((section) => {
        const right = section.rows.filter((row) => row.isCorrect).length;
        return (
          <section key={section.key} className="exam-review-section">
            <h4>
              {section.title}
              <small>{t("review.correctCount", { right, total: section.rows.length })}</small>
            </h4>
            {section.rows.map((row) => (
              <div key={`${row.section}-${row.number}`} className={`exam-review-row ${row.isCorrect ? "is-correct" : "is-wrong"}`}>
                {row.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <div>
                  <p>
                    <b>{row.number}.</b> <MathText text={row.question.replace(/\{\{\d+\}\}/g, "____")} />
                  </p>
                  <small>
                    {t("review.yourAnswer")}: {row.given ? <MathText text={row.given} size={14} /> : t("review.noAnswer")}
                  </small>
                  {!row.isCorrect && row.correctAnswer ? (
                    <small className="exam-review-right">
                      {t("review.correctAnswer")}: <MathText text={row.correctAnswer} size={14} />
                    </small>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

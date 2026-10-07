import { useTranslation } from "react-i18next";
import type { ExamStudentResult } from "@/shared/types";

export interface ExamResultCardProps {
  result: ExamStudentResult;
}

export function ExamResultCard({ result }: ExamResultCardProps) {
  const { t } = useTranslation("exam");
  const total = result.total;

  return (
    <div className="exam-result-card">
      <div className="exam-result-total">
        {total && total.score !== null ? (
          <>
            <strong>
              {total.score}
              {total.max ? <small>/{total.max}</small> : null}
            </strong>
            <span>{total.label || t("result.total")}</span>
            {total.range ? (
              <small className="exam-result-range">
                {t("result.range", { from: total.range[0], to: total.range[1] })}
              </small>
            ) : null}
            {total.level ? <small className="exam-result-level">{total.level}</small> : null}
            {result.approximate ? <small className="exam-result-approx">{t("result.approximate")}</small> : null}
          </>
        ) : (
          <>
            <strong className="exam-result-pending-mark">—</strong>
            <span>{t("result.waitingTeacher")}</span>
          </>
        )}
      </div>

      <div className="exam-result-sections">
        {result.sections.map((section) => (
          <div key={section.key} className="exam-result-section">
            <span>{section.title}</span>
            <strong>
              {section.score !== null
                ? `${section.score}${section.scaleMax ? `/${section.scaleMax}` : ""}`
                : section.percent !== null
                  ? `${Math.round(section.percent)}%`
                  : t("result.pendingShort")}
            </strong>
            {section.earned !== null && section.max !== null ? (
              <small>{t("result.earned", { earned: section.earned, max: section.max })}</small>
            ) : null}
          </div>
        ))}
      </div>

      {result.pending.length ? (
        <p className="exam-result-pending">{t("result.pendingList", { list: result.pending.join(", ") })}</p>
      ) : null}
    </div>
  );
}

import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamWritingAi } from "@/shared/types";

export interface ExamWritingAiPanelProps {
  ai: ExamWritingAi;
  /** O'qituvchi uchun: taklif etilgan bandni ball maydoniga qo'yish. */
  onApply?: (band: number) => void;
}

/** IELTS Writing AI tahlili: 4 mezon bo'yicha band, xatolar, nimani yaxshilash kerak. */
export function ExamWritingAiPanel({ ai, onApply }: ExamWritingAiPanelProps) {
  const { t } = useTranslation("exam");

  if (ai.status === "queued") return <p className="exam-result-loading">{t("writingAi.queued")}</p>;
  if (ai.status === "failed") return <p className="exam-result-loading">{t("writingAi.failed", { error: ai.error })}</p>;

  return (
    <div className="exam-writing-ai">
      {ai.suggestedBand !== null && onApply ? (
        <div className="exam-writing-ai-suggest">
          <strong>{t("writingAi.suggested", { band: ai.suggestedBand })}</strong>
          <button type="button" onClick={() => onApply(ai.suggestedBand as number)}>
            {t("writingAi.apply")}
          </button>
          <small>{t("writingAi.teacherConfirms")}</small>
        </div>
      ) : null}

      {ai.items.map((item, index) => (
        <article key={`${item.task}-${index}`} className="exam-writing-ai-item">
          <header>
            <h4>{t("writingAi.taskTitle", { task: item.task })}</h4>
            <b>{t("writingAi.band", { band: item.overallBand })}</b>
          </header>
          <small className={item.tooShort ? "is-warn" : ""}>
            {t("writingAi.words", { count: item.wordCount, min: item.minWords })}
            {item.tooShort ? ` · ${t("writingAi.tooShort")}` : ""}
          </small>

          <ul className="exam-writing-ai-criteria">
            {item.criteria.map((criterion) => (
              <li key={criterion.key}>
                <span>
                  {criterion.title}
                  {criterion.capped ? <em> ({t("writingAi.capped")})</em> : null}
                </span>
                <b>{criterion.band}</b>
                <p>{criterion.comment}</p>
              </li>
            ))}
          </ul>

          {item.errors.length ? (
            <div className="exam-writing-ai-errors">
              <h5>
                <TriangleAlert size={14} /> {t("writingAi.errors")}
              </h5>
              {item.errors.map((error, errorIndex) => (
                <p key={errorIndex}>
                  <q>{error.quote}</q> — {error.issue}
                  {error.correction ? (
                    <>
                      {" "}
                      → <b>{error.correction}</b>
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          ) : null}

          <div className="exam-writing-ai-cols">
            {item.strengths.length ? (
              <div>
                <h5>
                  <CheckCircle2 size={14} /> {t("writingAi.strengths")}
                </h5>
                <ul>
                  {item.strengths.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.improvements.length ? (
              <div>
                <h5>
                  <Lightbulb size={14} /> {t("writingAi.improvements")}
                </h5>
                <ul>
                  {item.improvements.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {item.upgradedParagraph ? (
            <div className="exam-writing-ai-upgrade">
              <h5>{t("writingAi.upgraded")}</h5>
              <p>{item.upgradedParagraph}</p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

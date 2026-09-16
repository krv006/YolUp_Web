import { useTranslation } from "react-i18next";

export interface QuizPreviewQuestion {
  key: string;
  text: string;
  points: string;
  options: Array<{ key: string; text: string }>;
}

export interface QuizPreviewProps {
  title: string;
  questions: readonly QuizPreviewQuestion[];
}

export function QuizPreview({ title, questions }: QuizPreviewProps) {
  const { t } = useTranslation("quiz");

  return (
    <aside className="quiz-preview" aria-label={t("preview.regionAria")}>
      <div className="quiz-preview-head">
        <span>{t("preview.eyebrow")}</span>
        <strong>{title || t("preview.untitled")}</strong>
      </div>

      <div className="quiz-preview-sheet">
        <div className="quiz-attempt-form">
          {questions.map((question, index) => (
            <div key={question.key} className="quiz-attempt-question">
              <div className="quiz-attempt-question-head">
                <span>{t("attemptDialog.questionNumber", { number: index + 1 })}</span>
                <b>{t("attemptDialog.pointsSuffix", { count: Number(question.points) || 1 })}</b>
              </div>
              <p className={question.text.trim() ? "" : "quiz-preview-placeholder"}>
                {question.text.trim() || t("preview.questionPlaceholder")}
              </p>
              <div className="quiz-option-list">
                {question.options.map((option) => (
                  <div key={option.key} className="quiz-attempt-option">
                    <span className="quiz-option-radio" aria-hidden="true" />
                    <span className={option.text.trim() ? "" : "quiz-preview-placeholder"}>
                      {option.text.trim() || t("preview.optionPlaceholder")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

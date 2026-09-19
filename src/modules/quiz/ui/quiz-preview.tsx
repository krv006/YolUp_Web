import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QuizAnswerValue } from "@/shared/types";
import { draftToStudentQuestion, type QuestionDraft } from "../lib/question-draft";
import { QuestionAnswerInput, QuestionPrompt } from "./question-answer-input";

export interface QuizPreviewProps {
  title: string;
  questions: readonly QuestionDraft[];
}

export function QuizPreview({ title, questions }: QuizPreviewProps) {
  const { t } = useTranslation("quiz");
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});

  return (
    <aside className="quiz-preview" aria-label={t("preview.regionAria")}>
      <div className="quiz-preview-head">
        <span>{t("preview.eyebrow")}</span>
        <strong>{title || t("preview.untitled")}</strong>
      </div>

      <div className="quiz-preview-sheet">
        <div className="quiz-attempt-form">
          {questions.map((draft, index) => {
            const question = draftToStudentQuestion(draft, index);
            return (
              <div key={draft.key} className="quiz-attempt-question">
                <div className="quiz-attempt-question-head">
                  <span>
                    {t("attemptDialog.questionNumber", { number: index + 1 })} · {t(`types.${question.type}`)}
                  </span>
                  <b>{t("attemptDialog.pointsSuffix", { count: question.points })}</b>
                </div>
                <QuestionPrompt question={question} />
                <QuestionAnswerInput
                  question={question}
                  number={index + 1}
                  value={answers[draft.key]}
                  onChange={(value) => setAnswers((current) => ({ ...current, [draft.key]: value }))}
                />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { CheckCircle2, CircleDot, Clock3, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuizAnswerValue, QuizAttemptAnswer, QuizAttemptResult, QuizDetail } from "@/shared/types";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { blankTextForDisplay, emptyAnswer } from "../lib/answer-value";
import { useQuiz, useSubmitQuizAttempt } from "../model/quiz.queries";
import { MathText } from "./math-text";
import { QuestionAnswerInput, QuestionPrompt } from "./question-answer-input";

export interface QuizAttemptDialogProps {
  quizId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizAttemptDialog({ quizId, open, onOpenChange }: QuizAttemptDialogProps) {
  const { t } = useTranslation("quiz");
  const quiz = useQuiz(open ? quizId : null);
  const submit = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAnswers({});
      setResult(null);
    }
    onOpenChange(next);
  }

  function submitAttempt(quizData: QuizDetail) {
    const payload = quizData.questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id] ?? emptyAnswer(question),
    }));
    submit.mutate(
      { quizId: quizData.id, answers: payload },
      { onSuccess: setResult }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <DialogContent
          className="quiz-attempt-dialog"
          title={quiz.data?.title ?? t("attemptDialog.defaultTitle")}
          description={quiz.data?.description || t("attemptDialog.defaultDescription")}
        >
          {!quiz.data ? (
            <div className="hw-result-state">
              <Clock3 size={26} />
              <p>{t("attemptDialog.loading")}</p>
            </div>
          ) : result ? (
            <QuizResultView
              result={result}
              onRetry={() => {
                setAnswers({});
                setResult(null);
              }}
              onClose={() => handleOpenChange(false)}
            />
          ) : (
            <div className="quiz-attempt-form">
              {quiz.data.questions.map((question, index) => (
                <div key={question.id} className="quiz-attempt-question">
                  <div className="quiz-attempt-question-head">
                    <span>{t("attemptDialog.questionNumber", { number: index + 1 })}</span>
                    <b>{t("attemptDialog.pointsSuffix", { count: question.points })}</b>
                  </div>
                  <QuestionPrompt question={question} />
                  <QuestionAnswerInput
                    question={question}
                    number={index + 1}
                    value={answers[question.id]}
                    onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
                  />
                </div>
              ))}
              <div className="dialog-actions">
                <Button variant="secondary" onClick={() => handleOpenChange(false)}>
                  {t("attemptDialog.close")}
                </Button>
                <Button loading={submit.isPending} onClick={() => submitAttempt(quiz.data)}>
                  {t("attemptDialog.submit")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function QuizResultView({
  result,
  onRetry,
  onClose,
}: {
  result: QuizAttemptResult;
  onRetry: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("quiz");
  return (
    <div className="quiz-result">
      <div className="quiz-result-score">
        <strong>
          {result.score}
          <small>/{result.maxScore}</small>
        </strong>
        <span>{t("attemptDialog.result")}</span>
      </div>
      <div className="quiz-attempt-question-list">
        {result.answers.map((answer, index) => (
          <QuizResultRow key={answer.questionId} answer={answer} number={index + 1} />
        ))}
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onRetry}>
          {t("attemptDialog.retry")}
        </Button>
        <Button onClick={onClose}>{t("attemptDialog.close")}</Button>
      </div>
    </div>
  );
}

function QuizResultRow({ answer, number }: { answer: QuizAttemptAnswer; number: number }) {
  const { t } = useTranslation("quiz");
  const earned = answer.earnedPoints ?? (answer.isCorrect ? answer.points : 0);
  const partial = !answer.isCorrect && earned !== null && earned > 0;
  const given = answer.givenDisplay ?? answer.selectedOptionText;
  const correct = answer.correctDisplay ?? answer.correctOption?.text ?? null;
  const tone = answer.isCorrect ? "is-correct" : partial ? "is-partial" : "is-wrong";

  return (
    <div className={`quiz-result-row ${tone}`}>
      <div className="quiz-result-row-head">
        {answer.isCorrect ? <CheckCircle2 size={16} /> : partial ? <CircleDot size={16} /> : <XCircle size={16} />}
        <p>
          {number}. <MathText text={blankTextForDisplay(answer.questionText)} />
        </p>
        {answer.points !== null ? (
          <b className="quiz-result-points">
            {t("attemptDialog.earnedPoints", { earned: earned ?? 0, total: answer.points })}
          </b>
        ) : null}
      </div>
      <small>
        {t("attemptDialog.yourAnswerLabel")}{" "}
        {given ? <MathText text={given} size={14} /> : t("attemptDialog.notAnswered")}
      </small>
      {!answer.isCorrect && correct ? (
        <small className="quiz-result-correct">
          {t("attemptDialog.correctAnswerLabel")} <MathText text={correct} size={14} />
        </small>
      ) : null}
    </div>
  );
}

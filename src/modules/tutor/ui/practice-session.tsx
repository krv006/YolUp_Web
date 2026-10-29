import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PracticeSet } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

export interface PracticeSessionProps {
  set: PracticeSet;
  onRestart?: () => void;
  restarting?: boolean;
}

export function PracticeSession({ set, onRestart, restarting = false }: PracticeSessionProps) {
  const { t } = useTranslation("student");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = Object.keys(answers).length;
  const correct = set.questions.filter((question, index) => answers[index] === question.correctIndex).length;
  const done = answered === set.questions.length;

  return (
    <div className="flex flex-col gap-4">
      {set.questions.map((question, index) => {
        const picked = answers[index];
        const revealed = picked !== undefined;
        return (
          <section key={index} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-caption-strong text-brand">
                {index + 1}
              </span>
              <strong className="min-w-0 flex-1 pt-0.5 text-title font-medium text-ink">{question.text}</strong>
            </span>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex;
                const isPicked = optionIndex === picked;
                const tone = !revealed
                  ? "border-line-strong bg-surface text-ink hover:bg-subtle"
                  : isCorrect
                    ? "border-success-fg bg-success-bg text-success-fg"
                    : isPicked
                      ? "border-error-text bg-danger-bg text-error-text"
                      : "border-line bg-surface text-ink-tertiary";
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    disabled={revealed}
                    className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-body-sm transition-colors disabled:cursor-default disabled:opacity-100 ${tone}`}
                    onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                  >
                    <span className="min-w-0 flex-1">{option}</span>
                    {revealed && isCorrect ? <Icon name="check-circle" size={18} className="shrink-0" /> : null}
                    {revealed && isPicked && !isCorrect ? <Icon name="cancel" size={18} className="shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
            {revealed && question.explanation ? (
              <p className="rounded-xl bg-subtle px-4 py-3 text-body-xs text-ink-secondary">{question.explanation}</p>
            ) : null}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-title text-ink">
            {done
              ? t("tutor.score", { correct, total: set.questions.length })
              : t("tutor.progress", { answered, total: set.questions.length })}
          </strong>
          {set.limit ? (
            <small className="text-caption text-ink-tertiary">
              {t("tutor.usage", { used: set.used ?? 0, limit: set.limit })}
            </small>
          ) : null}
        </span>
        {onRestart ? (
          <button
            type="button"
            disabled={restarting}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60"
            onClick={onRestart}
          >
            <Icon name="refresh" size={18} />
            {t("tutor.more")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

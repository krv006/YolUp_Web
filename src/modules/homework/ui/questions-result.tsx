import { useTranslation } from "react-i18next";
import type { HomeworkAnswer } from "@/shared/types";

function scoreText(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function QuestionsResult({
  answers,
  scores,
  onScoreChange,
}: {
  answers: HomeworkAnswer[];
  scores?: Record<string, string>;
  onScoreChange?: (questionId: string, value: string) => void;
}) {
  const { t } = useTranslation("homework");
  const total = answers.reduce((sum, item) => sum + item.points, 0);
  const earned = answers.reduce((sum, item) => sum + (item.score ?? 0), 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <strong className="flex-1 text-title text-ink">{t("questions.resultTitle")}</strong>
        <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-caption-strong text-brand">
          {t("questions.resultTotal", { earned: scoreText(earned), total })}
        </span>
      </div>
      {answers.map((answer, index) => {
        const test = answer.type === "single" || answer.type === "multiple";
        const picked = Array.isArray(answer.answer) ? answer.answer : [];
        const tone =
          answer.isCorrect === true
            ? "border-success-fg/40 bg-success-bg"
            : answer.isCorrect === false
              ? "border-danger/30 bg-danger-bg"
              : "border-line bg-surface";
        return (
          <article key={answer.questionId} className={`flex flex-col gap-2 rounded-xl border p-4 ${tone}`}>
            <div className="flex items-start gap-2">
              <strong className="text-title-sm text-brand">{index + 1}.</strong>
              <p className="min-w-0 flex-1 text-body text-ink break-words whitespace-pre-wrap">{answer.text}</p>
              {onScoreChange ? (
                <label className="flex shrink-0 items-center gap-1 text-caption-strong text-ink-secondary">
                  <input
                    className="h-8 w-14 rounded-md border border-line bg-surface px-2 text-center text-body-sm text-ink outline-none focus:border-focus"
                    inputMode="decimal"
                    aria-label={t("questions.scoreAria", { n: index + 1 })}
                    value={scores?.[answer.questionId] ?? (answer.score === null ? "" : String(answer.score))}
                    onChange={(event) => onScoreChange(answer.questionId, event.target.value.replace(/[^\d.,]/g, "").replace(",", "."))}
                  />
                  / {answer.points}
                </label>
              ) : (
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-caption-strong text-ink-secondary">
                  {scoreText(answer.score)} / {answer.points}
                </span>
              )}
            </div>
            {test ? (
              <ul className="flex flex-col gap-1">
                {answer.options.map((option, optionIndex) => {
                  const chosen = picked.includes(optionIndex);
                  const right = answer.correct?.includes(optionIndex) ?? false;
                  return (
                    <li
                      key={optionIndex}
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-body-sm ${
                        right ? "text-success-fg" : chosen ? "text-danger" : "text-ink-secondary"
                      }`}
                    >
                      <span aria-hidden="true">{chosen ? (right ? "✓" : "✗") : right ? "✓" : "•"}</span>
                      <span className={chosen ? "font-semibold" : ""}>{option}</span>
                      {chosen ? <small className="text-caption">{t("questions.yourChoice")}</small> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-md bg-subtle px-3 py-2 text-body-sm text-ink break-words whitespace-pre-wrap">
                {typeof answer.answer === "string" && answer.answer ? answer.answer : t("questions.noAnswer")}
              </p>
            )}
            {answer.aiScore !== null && onScoreChange ? (
              <small className="text-caption text-ink-tertiary">{t("questions.aiScore", { score: scoreText(answer.aiScore) })}</small>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

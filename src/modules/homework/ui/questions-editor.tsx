import { useTranslation } from "react-i18next";
import type { HomeworkQuestionType } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import {
  changeType,
  emptyQuestion,
  isTestQuestion,
  MAX_OPTIONS,
  MAX_POINTS,
  MAX_QUESTIONS,
  questionIssue,
  removeOption,
  toggleCorrect,
  totalPoints,
  type DraftQuestion,
} from "../lib/homework-questions";

const TYPES: HomeworkQuestionType[] = ["single", "multiple", "short", "long"];
const FIELD =
  "rounded-md border border-transparent bg-surface px-3.5 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus";

export interface QuestionsEditorProps {
  value: DraftQuestion[];
  onChange: (value: DraftQuestion[]) => void;
  locked?: boolean;
  showIssues?: boolean;
}

export function QuestionsEditor({ value, onChange, locked = false, showIssues = false }: QuestionsEditorProps) {
  const { t } = useTranslation("homework");

  function update(index: number, next: DraftQuestion) {
    onChange(value.map((item, position) => (position === index ? next : item)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-body-xs text-ink-secondary">
          {t("questions.title")}
          {value.length ? ` · ${t("questions.summary", { count: value.length, points: totalPoints(value) })}` : ""}
        </span>
      </div>

      {locked ? (
        <p className="rounded-md bg-accent-saffron-bg px-4 py-3 text-body-sm text-accent-saffron-fg">{t("questions.locked")}</p>
      ) : null}

      {value.map((question, index) => {
        const issue = showIssues ? questionIssue(question) : null;
        const test = isTestQuestion(question.type);
        return (
          <article key={question.key} className="flex flex-col gap-3 rounded-xl border border-line bg-subtle p-3.5">
            <div className="flex items-center gap-2">
              <strong className="text-title-sm text-ink">{t("questions.number", { n: index + 1 })}</strong>
              <span className="flex-1" />
              <label className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
                {t("questions.points")}
                <input
                  className={`${FIELD} h-9 w-16 text-center ${issue === "points" ? "border-danger" : ""}`}
                  inputMode="numeric"
                  value={Number.isFinite(question.points) ? String(question.points) : ""}
                  disabled={locked}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                    update(index, { ...question, points: digits ? Math.min(MAX_POINTS, Number(digits)) : Number.NaN });
                  }}
                />
              </label>
              {!locked ? (
                <span className="flex items-center">
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-secondary hover:bg-surface disabled:opacity-30"
                    aria-label={t("questions.moveUp")}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <Icon name="expand-less" size={18} />
                  </button>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-secondary hover:bg-surface disabled:opacity-30"
                    aria-label={t("questions.moveDown")}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <Icon name="expand-more" size={18} />
                  </button>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-ink-secondary hover:bg-danger-bg hover:text-danger"
                    aria-label={t("questions.remove", { n: index + 1 })}
                    onClick={() => onChange(value.filter((_, position) => position !== index))}
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </span>
              ) : null}
            </div>

            <select
              className={`${FIELD} h-10 w-full text-body-sm`}
              value={question.type}
              disabled={locked}
              aria-label={t("questions.typeLabel")}
              onChange={(event) => update(index, changeType(question, event.target.value as HomeworkQuestionType))}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`questions.types.${type}`)}
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              maxLength={5000}
              className={`${FIELD} w-full resize-none py-2.5 ${issue === "text" ? "border-danger" : ""}`}
              value={question.text}
              disabled={locked}
              placeholder={t("questions.textPlaceholder")}
              onChange={(event) => update(index, { ...question, text: event.target.value })}
            />

            {test ? (
              <div className="flex flex-col gap-2">
                <small className="text-caption text-ink-tertiary">
                  {question.type === "single" ? t("questions.markOne") : t("questions.markMany")}
                </small>
                {question.options.map((option, optionIndex) => {
                  const correct = question.correct.includes(optionIndex);
                  return (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
                          correct ? "bg-success-bg text-success-fg" : "bg-surface text-icon-secondary hover:text-ink"
                        }`}
                        aria-pressed={correct}
                        aria-label={t("questions.markCorrect", { n: optionIndex + 1 })}
                        disabled={locked}
                        onClick={() => update(index, toggleCorrect(question, optionIndex))}
                      >
                        <Icon
                          name={question.type === "single" ? (correct ? "check-circle" : "radio-unchecked") : correct ? "check-box-fill" : "check-box"}
                          size={20}
                        />
                      </button>
                      <input
                        className={`${FIELD} h-10 min-w-0 flex-1 ${issue === "options" && !option.trim() ? "border-danger" : ""}`}
                        value={option}
                        maxLength={500}
                        disabled={locked}
                        placeholder={t("questions.optionPlaceholder", { n: optionIndex + 1 })}
                        onChange={(event) =>
                          update(index, {
                            ...question,
                            options: question.options.map((item, position) => (position === optionIndex ? event.target.value : item)),
                          })
                        }
                      />
                      {!locked && question.options.length > 2 ? (
                        <button
                          type="button"
                          className="grid size-8 shrink-0 place-items-center rounded-full text-ink-secondary hover:bg-surface"
                          aria-label={t("questions.removeOption", { n: optionIndex + 1 })}
                          onClick={() => update(index, removeOption(question, optionIndex))}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                {!locked && question.options.length < MAX_OPTIONS ? (
                  <button
                    type="button"
                    className="flex h-9 w-fit items-center gap-1.5 rounded-full px-3 text-caption-strong text-brand hover:bg-brand-subtle"
                    onClick={() => update(index, { ...question, options: [...question.options, ""] })}
                  >
                    <Icon name="add" size={16} />
                    {t("questions.addOption")}
                  </button>
                ) : null}
              </div>
            ) : (
              <small className="text-caption text-ink-tertiary">
                {question.type === "short" ? t("questions.shortHint") : t("questions.longHint")}
              </small>
            )}

            {issue ? <small className="text-caption text-danger">{t(`questions.issues.${issue}`)}</small> : null}
          </article>
        );
      })}

      {!locked && value.length < MAX_QUESTIONS ? (
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-button text-brand transition-colors hover:border-brand hover:bg-brand-subtle"
          onClick={() => onChange([...value, emptyQuestion(value.at(-1)?.type ?? "single")])}
        >
          <Icon name="add" size={18} />
          {t("questions.add")}
        </button>
      ) : null}
    </section>
  );
}

import { Fragment } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuizAnswerValue, QuizQuestion } from "@/shared/types";
import { emptyAnswer } from "../lib/answer-value";
import { MathText } from "./math-text";

export interface QuestionAnswerInputProps {
  question: QuizQuestion;
  number: number;
  value: QuizAnswerValue | undefined;
  onChange: (value: QuizAnswerValue) => void;
}

function asType<T extends QuizAnswerValue["type"]>(
  value: QuizAnswerValue,
  type: T
): Extract<QuizAnswerValue, { type: T }> | null {
  return value.type === type ? (value as Extract<QuizAnswerValue, { type: T }>) : null;
}

export function QuestionPrompt({ question }: { question: QuizQuestion }) {
  const { t } = useTranslation("quiz");
  if (question.type === "fill_blank") return <small className="quiz-answer-hint">{t("answer.fillBlankHint")}</small>;
  if (!question.text.trim()) return <p className="quiz-preview-placeholder">{t("preview.questionPlaceholder")}</p>;
  return (
    <p>
      <MathText text={question.text} />
    </p>
  );
}

export function QuestionAnswerInput({ question, number, value, onChange }: QuestionAnswerInputProps) {
  const { t } = useTranslation("quiz");
  const current = value && value.type === question.type ? value : emptyAnswer(question);
  const groupLabel = t("attemptDialog.answersAria", { number });

  const single = asType(current, "single");
  if (single) {
    return (
      <div className="quiz-option-list" role="radiogroup" aria-label={groupLabel}>
        {question.options.map((option) => {
          const active = single.optionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`quiz-attempt-option ${active ? "is-active" : ""}`}
              onClick={() => onChange({ type: "single", optionId: option.id })}
            >
              <span className={`quiz-option-radio ${active ? "is-active" : ""}`} aria-hidden="true" />
              <span>{option.text ? <MathText text={option.text} /> : <Placeholder text={t("preview.optionPlaceholder")} />}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const multiple = asType(current, "multiple");
  if (multiple) {
    return (
      <div className="quiz-option-list" role="group" aria-label={groupLabel}>
        <small className="quiz-answer-hint">{t("answer.multipleHint")}</small>
        {question.options.map((option) => {
          const active = multiple.optionIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              className={`quiz-attempt-option ${active ? "is-active" : ""}`}
              onClick={() =>
                onChange({
                  type: "multiple",
                  optionIds: active
                    ? multiple.optionIds.filter((id) => id !== option.id)
                    : [...multiple.optionIds, option.id],
                })
              }
            >
              <span className={`quiz-option-check ${active ? "is-active" : ""}`} aria-hidden="true" />
              <span>{option.text ? <MathText text={option.text} /> : <Placeholder text={t("preview.optionPlaceholder")} />}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const trueFalse = asType(current, "true_false");
  if (trueFalse) {
    return (
      <div className="quiz-answer-bool" role="radiogroup" aria-label={groupLabel}>
        {[true, false].map((option) => {
          const active = trueFalse.value === option;
          return (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={active}
              className={`quiz-attempt-option ${active ? "is-active" : ""}`}
              onClick={() => onChange({ type: "true_false", value: option })}
            >
              <span className={`quiz-option-radio ${active ? "is-active" : ""}`} aria-hidden="true" />
              {option ? t("answer.true") : t("answer.false")}
            </button>
          );
        })}
      </div>
    );
  }

  const numeric = asType(current, "numeric");
  if (numeric) {
    return (
      <input
        className="quiz-answer-input"
        inputMode="decimal"
        value={numeric.value}
        aria-label={groupLabel}
        placeholder={t("answer.numericPlaceholder")}
        onChange={(event) => onChange({ type: "numeric", value: event.target.value })}
      />
    );
  }

  const text = asType(current, "text");
  if (text) {
    return (
      <input
        className="quiz-answer-input"
        value={text.value}
        aria-label={groupLabel}
        placeholder={t("answer.textPlaceholder")}
        onChange={(event) => onChange({ type: "text", value: event.target.value })}
      />
    );
  }

  const matching = asType(current, "matching");
  if (matching) {
    return (
      <div className="quiz-answer-matching" role="group" aria-label={groupLabel}>
        {question.matchLeft.map((left) => (
          <label key={left.id} className="quiz-answer-match-row">
            <span>{left.text ? <MathText text={left.text} /> : <Placeholder text="…" />}</span>
            <select
              value={matching.pairs[left.id] ?? ""}
              onChange={(event) => {
                const pairs = { ...matching.pairs };
                if (event.target.value) pairs[left.id] = event.target.value;
                else delete pairs[left.id];
                onChange({ type: "matching", pairs });
              }}
            >
              <option value="">{t("answer.matchPlaceholder")}</option>
              {question.matchRight.map((right) => (
                <option key={right.id} value={right.id}>
                  {right.text}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  const ordering = asType(current, "ordering");
  if (ordering) {
    const byId = new Map(question.options.map((option) => [option.id, option]));
    const known = ordering.order.filter((id) => byId.has(id));
    const order = [...known, ...question.options.map((option) => option.id).filter((id) => !known.includes(id))];
    const moveItem = (from: number, to: number) => {
      if (to < 0 || to >= order.length) return;
      const next = [...order];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange({ type: "ordering", order: next });
    };
    return (
      <ol className="quiz-answer-ordering" aria-label={groupLabel}>
        {order.map((id, position) => (
          <li key={id}>
            <span className="quiz-answer-order-index">{position + 1}</span>
            <span className="quiz-answer-order-text">
              {byId.get(id)?.text ? <MathText text={byId.get(id)?.text ?? ""} /> : <Placeholder text="…" />}
            </span>
            <button
              type="button"
              disabled={position === 0}
              aria-label={t("editor.moveUpAria")}
              onClick={() => moveItem(position, position - 1)}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              disabled={position === order.length - 1}
              aria-label={t("editor.moveDownAria")}
              onClick={() => moveItem(position, position + 1)}
            >
              <ArrowDown size={14} />
            </button>
          </li>
        ))}
      </ol>
    );
  }

  const fill = asType(current, "fill_blank");
  if (fill) {
    const parts = question.text.split(/(\{\{\d+\}\})/g);
    return (
      <div className="quiz-answer-fill">
        {parts.map((part, index) => {
          const match = /^\{\{(\d+)\}\}$/.exec(part);
          if (!match) return <Fragment key={index}>{part ? <MathText text={part} /> : null}</Fragment>;
          const blankIndex = Number(match[1]) - 1;
          return (
            <input
              key={index}
              className="quiz-answer-blank"
              value={fill.values[blankIndex] ?? ""}
              aria-label={t("answer.blankAria", { number: blankIndex + 1 })}
              onChange={(event) => {
                const values = Array.from(
                  { length: Math.max(question.blankCount, fill.values.length, blankIndex + 1) },
                  (_, position) => fill.values[position] ?? ""
                );
                values[blankIndex] = event.target.value;
                onChange({ type: "fill_blank", values });
              }}
            />
          );
        })}
      </div>
    );
  }

  return null;
}

function Placeholder({ text }: { text: string }) {
  return <span className="quiz-preview-placeholder">{text}</span>;
}

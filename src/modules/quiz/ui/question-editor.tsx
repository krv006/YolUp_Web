import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Sigma, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormulaPalette, MathFieldInput, type MathFieldInputHandle } from "@/modules/board";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { QuizQuestionType } from "@/shared/types";
import {
  MAX_OPTIONS,
  MAX_POINTS,
  MIN_POINTS,
  QUESTION_TYPE_ORDER,
  changeDraftType,
  optionLetter,
  type KeyFactory,
  type QuestionDraft,
} from "../lib/question-draft";

export interface QuestionEditorProps {
  draft: QuestionDraft;
  index: number;
  canRemove: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
}

interface FocusTarget {
  element: HTMLInputElement | HTMLTextAreaElement;
  apply: (value: string) => void;
}

function insertAt(element: HTMLInputElement | HTMLTextAreaElement, snippet: string): string {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;
  return `${element.value.slice(0, start)}${snippet}${element.value.slice(end)}`;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function QuestionEditor({ draft, index, canRemove, newKey, onChange, onRemove }: QuestionEditorProps) {
  const { t } = useTranslation("quiz");
  const number = index + 1;
  const textRef = useRef<HTMLTextAreaElement>(null);
  const focusRef = useRef<FocusTarget | null>(null);
  const mathRef = useRef<MathFieldInputHandle>(null);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formula, setFormula] = useState("");

  function patch(next: Partial<QuestionDraft> | ((current: QuestionDraft) => Partial<QuestionDraft>)) {
    onChange((current) => ({ ...current, ...(typeof next === "function" ? next(current) : next) }));
  }

  function remember(element: HTMLInputElement | HTMLTextAreaElement, apply: (value: string) => void) {
    focusRef.current = { element, apply };
  }

  function insertSnippet(snippet: string, caretOffset = snippet.length) {
    const target = focusRef.current?.element.isConnected
      ? focusRef.current
      : textRef.current
        ? { element: textRef.current, apply: (text: string) => patch({ text }) }
        : null;
    if (!target) return;
    target.apply(insertAt(target.element, snippet));
    const caret = (target.element.selectionStart ?? target.element.value.length) + caretOffset;
    requestAnimationFrame(() => {
      target.element.focus();
      target.element.setSelectionRange(caret, caret);
    });
  }

  function applyFormula() {
    const latex = formula.replace(/\\placeholder\{\}/g, "").trim();
    if (latex) insertSnippet(`$${latex}$`);
    setFormula("");
    setFormulaOpen(false);
  }

  function updateOption(key: string, text: string) {
    patch((current) => ({
      options: current.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
  }

  function removeOption(key: string) {
    patch((current) => ({
      options: current.options.filter((option) => option.key !== key),
      correctKeys: current.correctKeys.filter((correctKey) => correctKey !== key),
    }));
  }

  function toggleCorrect(key: string) {
    if (draft.type === "single") {
      patch({ correctKeys: [key] });
      return;
    }
    patch({
      correctKeys: draft.correctKeys.includes(key)
        ? draft.correctKeys.filter((correctKey) => correctKey !== key)
        : [...draft.correctKeys, key],
    });
  }

  function updateAnswer(position: number, value: string) {
    patch((current) => ({
      acceptedAnswers: current.acceptedAnswers.map((answer, index) => (index === position ? value : answer)),
    }));
  }

  function updatePair(key: string, side: "left" | "right", value: string) {
    patch((current) => ({
      pairs: current.pairs.map((pair) => (pair.key === key ? { ...pair, [side]: value } : pair)),
    }));
  }

  const blankSyntax = {
    syntax: `{{${t("editor.blankWord")}}}`,
    example: `{{${t("editor.blankExample")}}}`,
    sample: "{{100}}",
    interpolation: { escapeValue: false },
  };
  const typeOptions = QUESTION_TYPE_ORDER.map((type) => ({ value: type, label: t(`types.${type}`) }));
  const isChoice = draft.type === "single" || draft.type === "multiple";

  return (
    <div className="quiz-page-question">
      <div className="quiz-page-question-head">
        <span className="quiz-page-question-number">{number}.</span>
        <textarea
          ref={textRef}
          rows={1}
          className="quiz-page-question-text"
          value={draft.text}
          onChange={(event) => patch({ text: event.target.value })}
          onFocus={(event) => remember(event.currentTarget, (text) => patch({ text }))}
          placeholder={
            draft.type === "fill_blank"
              ? t("editor.fillBlankPlaceholder", blankSyntax)
              : t("createDialog.questionTextPlaceholder")
          }
        />
        <button
          type="button"
          className={`quiz-page-question-tool ${formulaOpen ? "is-active" : ""}`}
          aria-label={t("editor.formulaAria")}
          title={t("editor.formulaAria")}
          aria-expanded={formulaOpen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setFormulaOpen((current) => !current)}
        >
          <Sigma size={16} />
        </button>
        {canRemove ? (
          <button
            type="button"
            className="quiz-page-question-remove"
            aria-label={t("createDialog.removeQuestionAria", { number })}
            onClick={onRemove}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>

      {formulaOpen ? (
        <div className="quiz-formula-box">
          <FormulaPalette onInsert={(latex) => mathRef.current?.insert(latex)} />
          <MathFieldInput ref={mathRef} value={formula} onChange={setFormula} />
          <div className="quiz-formula-actions">
            <small>{t("editor.formulaHint")}</small>
            <button
              type="button"
              aria-label={t("editor.formulaCancel")}
              onClick={() => {
                setFormula("");
                setFormulaOpen(false);
              }}
            >
              <X size={15} />
            </button>
            <button
              type="button"
              className="is-primary"
              disabled={!formula.trim()}
              aria-label={t("editor.formulaInsert")}
              onClick={applyFormula}
            >
              <Check size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="quiz-page-question-meta">
        <div className="quiz-page-type-select">
          <SelectPicker
            label={t("editor.typeLabel")}
            hideLabel
            value={draft.type}
            onChange={(value) => onChange((current) => changeDraftType(current, value as QuizQuestionType, newKey))}
            options={typeOptions}
          />
        </div>
        <label className="quiz-page-points">
          <span>{t("editor.pointsLabel")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_POINTS}
            max={MAX_POINTS}
            step={1}
            value={draft.points}
            onChange={(event) => patch({ points: event.target.value })}
            aria-label={t("editor.pointsAria", { number })}
          />
        </label>
      </div>

      {isChoice ? (
        <>
          <div className="quiz-page-options">
            {draft.options.map((option, optionIndex) => (
              <div key={option.key} className="quiz-page-option">
                <span className="quiz-page-option-letter">{optionLetter(optionIndex)})</span>
                <input
                  value={option.text}
                  onChange={(event) => updateOption(option.key, event.target.value)}
                  onFocus={(event) => remember(event.currentTarget, (text) => updateOption(option.key, text))}
                  placeholder={t("createDialog.optionPlaceholderLettered", { letter: optionLetter(optionIndex) })}
                />
                {draft.options.length > 2 ? (
                  <button
                    type="button"
                    className="quiz-page-row-remove"
                    aria-label={t("editor.removeOptionAria", { letter: optionLetter(optionIndex) })}
                    onClick={() => removeOption(option.key)}
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            ))}
            {draft.options.length < MAX_OPTIONS ? (
              <button
                type="button"
                className="quiz-page-add-row"
                onClick={() => patch({ options: [...draft.options, { key: newKey(), text: "" }] })}
              >
                <Plus size={14} /> {t("editor.addOption")}
              </button>
            ) : null}
          </div>
          <div
            className="quiz-page-answer-row"
            role={draft.type === "single" ? "radiogroup" : "group"}
            aria-label={t("createDialog.correctAnswerGroupAria", { number })}
          >
            <span className="quiz-page-answer-label">
              {draft.type === "single" ? t("createDialog.correctAnswerLabel") : t("editor.correctAnswersLabel")}
            </span>
            {draft.options.map((option, optionIndex) => {
              const active = draft.correctKeys.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  role={draft.type === "single" ? "radio" : "checkbox"}
                  aria-checked={active}
                  aria-label={`${t("createDialog.markCorrectAria")}: ${optionLetter(optionIndex)}`}
                  className={`quiz-page-answer-letter ${draft.type === "multiple" ? "is-square" : ""} ${active ? "is-correct" : ""}`}
                  onClick={() => toggleCorrect(option.key)}
                >
                  {optionLetter(optionIndex)}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {draft.type === "true_false" ? (
        <div className="quiz-page-answer-row" role="radiogroup" aria-label={t("createDialog.correctAnswerGroupAria", { number })}>
          <span className="quiz-page-answer-label">{t("createDialog.correctAnswerLabel")}</span>
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              role="radio"
              aria-checked={draft.correctBool === value}
              className={`quiz-page-answer-chip ${draft.correctBool === value ? "is-correct" : ""}`}
              onClick={() => patch({ correctBool: value })}
            >
              {value ? t("answer.true") : t("answer.false")}
            </button>
          ))}
        </div>
      ) : null}

      {draft.type === "numeric" || draft.type === "text" ? (
        <div className="quiz-page-options">
          <span className="quiz-page-answer-label">{t("editor.acceptedAnswersLabel")}</span>
          {draft.acceptedAnswers.map((answer, answerIndex) => (
            <div key={answerIndex} className="quiz-page-option">
              <span className="quiz-page-option-letter">{answerIndex + 1})</span>
              <input
                value={answer}
                inputMode={draft.type === "numeric" ? "decimal" : undefined}
                onChange={(event) => updateAnswer(answerIndex, event.target.value)}
                placeholder={draft.type === "numeric" ? t("editor.numericPlaceholder") : t("editor.textPlaceholder")}
              />
              {draft.acceptedAnswers.length > 1 ? (
                <button
                  type="button"
                  className="quiz-page-row-remove"
                  aria-label={t("editor.removeAnswerAria", { number: answerIndex + 1 })}
                  onClick={() =>
                    patch({ acceptedAnswers: draft.acceptedAnswers.filter((_, index) => index !== answerIndex) })
                  }
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ))}
          {draft.acceptedAnswers.length < MAX_OPTIONS ? (
            <button
              type="button"
              className="quiz-page-add-row"
              onClick={() => patch({ acceptedAnswers: [...draft.acceptedAnswers, ""] })}
            >
              <Plus size={14} /> {t("editor.addAnswerVariant")}
            </button>
          ) : null}
          {draft.type === "numeric" ? (
            <label className="quiz-page-inline-field">
              <span>{t("editor.toleranceLabel")}</span>
              <input
                inputMode="decimal"
                value={draft.tolerance}
                onChange={(event) => patch({ tolerance: event.target.value })}
                placeholder="0"
              />
            </label>
          ) : (
            <label className="quiz-page-check">
              <input
                type="checkbox"
                checked={draft.caseSensitive}
                onChange={(event) => patch({ caseSensitive: event.target.checked })}
              />
              <span>{t("editor.caseSensitive")}</span>
            </label>
          )}
          <small className="quiz-page-hint">
            {draft.type === "numeric" ? t("editor.numericHint") : t("editor.textHint")}
          </small>
        </div>
      ) : null}

      {draft.type === "matching" ? (
        <div className="quiz-page-options">
          <small className="quiz-page-hint">{t("editor.matchingHint")}</small>
          {draft.pairs.map((pair, pairIndex) => (
            <div key={pair.key} className="quiz-page-pair">
              <span className="quiz-page-option-letter">{pairIndex + 1})</span>
              <input
                value={pair.left}
                onChange={(event) => updatePair(pair.key, "left", event.target.value)}
                onFocus={(event) => remember(event.currentTarget, (value) => updatePair(pair.key, "left", value))}
                placeholder={t("editor.pairLeftPlaceholder")}
              />
              <span className="quiz-page-pair-arrow" aria-hidden="true">↔</span>
              <input
                value={pair.right}
                onChange={(event) => updatePair(pair.key, "right", event.target.value)}
                onFocus={(event) => remember(event.currentTarget, (value) => updatePair(pair.key, "right", value))}
                placeholder={t("editor.pairRightPlaceholder")}
              />
              {draft.pairs.length > 2 ? (
                <button
                  type="button"
                  className="quiz-page-row-remove"
                  aria-label={t("editor.removePairAria", { number: pairIndex + 1 })}
                  onClick={() => patch({ pairs: draft.pairs.filter((item) => item.key !== pair.key) })}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ))}
          {draft.pairs.length < MAX_OPTIONS ? (
            <button
              type="button"
              className="quiz-page-add-row"
              onClick={() => patch({ pairs: [...draft.pairs, { key: newKey(), left: "", right: "" }] })}
            >
              <Plus size={14} /> {t("editor.addPair")}
            </button>
          ) : null}
        </div>
      ) : null}

      {draft.type === "ordering" ? (
        <div className="quiz-page-options">
          <small className="quiz-page-hint">{t("editor.orderingHint")}</small>
          {draft.options.map((option, optionIndex) => (
            <div key={option.key} className="quiz-page-option">
              <span className="quiz-page-option-letter">{optionIndex + 1})</span>
              <input
                value={option.text}
                onChange={(event) => updateOption(option.key, event.target.value)}
                onFocus={(event) => remember(event.currentTarget, (text) => updateOption(option.key, text))}
                placeholder={t("editor.itemPlaceholder", { number: optionIndex + 1 })}
              />
              <button
                type="button"
                className="quiz-page-row-remove"
                disabled={optionIndex === 0}
                aria-label={t("editor.moveUpAria")}
                onClick={() => patch({ options: move(draft.options, optionIndex, optionIndex - 1) })}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="quiz-page-row-remove"
                disabled={optionIndex === draft.options.length - 1}
                aria-label={t("editor.moveDownAria")}
                onClick={() => patch({ options: move(draft.options, optionIndex, optionIndex + 1) })}
              >
                <ArrowDown size={14} />
              </button>
              {draft.options.length > 2 ? (
                <button
                  type="button"
                  className="quiz-page-row-remove"
                  aria-label={t("editor.removeItemAria", { number: optionIndex + 1 })}
                  onClick={() => removeOption(option.key)}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ))}
          {draft.options.length < MAX_OPTIONS ? (
            <button
              type="button"
              className="quiz-page-add-row"
              onClick={() => patch({ options: [...draft.options, { key: newKey(), text: "" }] })}
            >
              <Plus size={14} /> {t("editor.addItem")}
            </button>
          ) : null}
        </div>
      ) : null}

      {draft.type === "fill_blank" ? (
        <div className="quiz-page-options">
          <small className="quiz-page-hint">{t("editor.fillBlankHint", blankSyntax)}</small>
          <button
            type="button"
            className="quiz-page-add-row"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (textRef.current) focusRef.current = { element: textRef.current, apply: (text) => patch({ text }) };
              insertSnippet("{{}}", 2);
            }}
          >
            <Plus size={14} /> {t("editor.addBlank")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import {
  MAX_OPTIONS,
  QUESTION_TYPE_ORDER,
  changeDraftType,
  optionLetter,
  type KeyFactory,
  type QuestionDraft,
} from "@/modules/quiz";
import type { QuizQuestionType } from "@/shared/types";

export interface TestQuestionCardProps {
  draft: QuestionDraft;
  index: number;
  locked?: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
  onFocus: () => void;
}

const FIELD =
  "h-11 w-full min-w-0 rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface disabled:opacity-60";

const ROW_BUTTON =
  "grid size-9 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40";

const ADD_BUTTON =
  "flex h-9 w-fit items-center gap-1.5 rounded-full text-button text-brand transition-colors hover:text-brand-strong disabled:opacity-50";

export function TestQuestionCard({
  draft,
  index,
  locked = false,
  newKey,
  onChange,
  onRemove,
  onFocus,
}: TestQuestionCardProps) {
  const { t } = useTranslation("quiz");

  function setOption(key: string, text: string) {
    onChange((current) => ({
      ...current,
      options: current.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
  }

  function toggleCorrect(key: string) {
    onChange((current) => ({
      ...current,
      correctKeys:
        current.type === "single"
          ? [key]
          : current.correctKeys.includes(key)
            ? current.correctKeys.filter((item) => item !== key)
            : [...current.correctKeys, key],
    }));
  }

  function setPair(key: string, side: "left" | "right", value: string) {
    onChange((current) => ({
      ...current,
      pairs: current.pairs.map((pair) => (pair.key === key ? { ...pair, [side]: value } : pair)),
    }));
  }

  return (
    <article
      className="flex flex-col gap-4 rounded-lg bg-surface p-5"
      onFocusCapture={onFocus}
    >
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-body-xs text-ink-tertiary">
          {t("editor.questionNumber", { number: index + 1 })}
        </span>

        <label className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-subtle px-3 text-label text-ink-secondary">
          <select
            className="cursor-pointer appearance-none bg-transparent pr-1 outline-none disabled:cursor-default"
            value={draft.type}
            disabled={locked}
            onChange={(event) =>
              onChange((current) =>
                changeDraftType(current, event.target.value as QuizQuestionType, newKey)
              )
            }
          >
            {QUESTION_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={14} className="shrink-0" />
        </label>

        <label className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-subtle px-3 text-label text-ink-secondary">
          <input
            className="w-6 min-w-0 bg-transparent text-right font-numeric outline-none"
            value={draft.points}
            inputMode="numeric"
            disabled={locked}
            onChange={(event) =>
              onChange((current) => ({ ...current, points: event.target.value }))
            }
          />
          {t("editor.points")}
        </label>

        <button
          type="button"
          className={ROW_BUTTON}
          disabled={locked}
          aria-label={t("editor.removeQuestion")}
          onClick={onRemove}
        >
          <Icon name="trash" size={18} />
        </button>
      </div>

      <input
        className="w-full min-w-0 bg-transparent text-title-lg text-ink outline-none placeholder:text-ink-tertiary disabled:opacity-70"
        value={draft.text}
        disabled={locked}
        placeholder={t("editor.questionPlaceholder")}
        onChange={(event) => onChange((current) => ({ ...current, text: event.target.value }))}
      />

      {draft.type === "single" || draft.type === "multiple" ? (
        <div className="flex flex-col gap-2.5">
          {draft.options.map((option, optionIndex) => {
            const correct = draft.correctKeys.includes(option.key);
            return (
              <div key={option.key} className="flex items-center gap-2.5">
                <button
                  type="button"
                  className={`grid size-9 shrink-0 place-items-center rounded-md text-label-strong transition-colors ${
                    correct ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary"
                  }`}
                  disabled={locked}
                  aria-pressed={correct}
                  onClick={() => toggleCorrect(option.key)}
                >
                  {correct ? <Icon name="check" size={16} /> : optionLetter(optionIndex)}
                </button>
                <input
                  className={FIELD}
                  value={option.text}
                  disabled={locked}
                  placeholder={t("editor.optionPlaceholder", { letter: optionLetter(optionIndex) })}
                  onChange={(event) => setOption(option.key, event.target.value)}
                />
                <button
                  type="button"
                  className={ROW_BUTTON}
                  disabled={locked || draft.options.length <= 2}
                  aria-label={t("editor.removeOption")}
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      options: current.options.filter((item) => item.key !== option.key),
                      correctKeys: current.correctKeys.filter((item) => item !== option.key),
                    }))
                  }
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            className={ADD_BUTTON}
            disabled={locked || draft.options.length >= MAX_OPTIONS}
            onClick={() =>
              onChange((current) => ({
                ...current,
                options: [...current.options, { key: newKey(), text: "" }],
              }))
            }
          >
            <Icon name="add" size={16} /> {t("editor.addOption")}
          </button>
        </div>
      ) : null}

      {draft.type === "true_false" ? (
        <div className="flex items-center gap-2.5">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              className={`flex h-11 flex-1 items-center justify-center rounded-md text-button transition-colors ${
                draft.correctBool === value
                  ? "bg-brand text-ink-inverse"
                  : "bg-subtle text-ink-secondary hover:text-ink"
              }`}
              disabled={locked}
              onClick={() => onChange((current) => ({ ...current, correctBool: value }))}
            >
              {value ? t("editor.true") : t("editor.false")}
            </button>
          ))}
        </div>
      ) : null}

      {draft.type === "numeric" || draft.type === "text" ? (
        <div className="flex flex-col gap-2.5">
          {draft.acceptedAnswers.map((answer, answerIndex) => (
            <div key={answerIndex} className="flex items-center gap-2.5">
              <input
                className={FIELD}
                value={answer}
                disabled={locked}
                placeholder={t("editor.answerPlaceholder")}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    acceptedAnswers: current.acceptedAnswers.map((item, position) =>
                      position === answerIndex ? event.target.value : item
                    ),
                  }))
                }
              />
              <button
                type="button"
                className={ROW_BUTTON}
                disabled={locked || draft.acceptedAnswers.length <= 1}
                aria-label={t("editor.removeAnswer")}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    acceptedAnswers: current.acceptedAnswers.filter(
                      (_, position) => position !== answerIndex
                    ),
                  }))
                }
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className={ADD_BUTTON}
            disabled={locked}
            onClick={() =>
              onChange((current) => ({
                ...current,
                acceptedAnswers: [...current.acceptedAnswers, ""],
              }))
            }
          >
            <Icon name="add" size={16} /> {t("editor.addAnswer")}
          </button>

          {draft.type === "numeric" ? (
            <label className="flex items-center gap-2.5">
              <span className="shrink-0 text-body-xs text-ink-secondary">
                {t("editor.tolerance")}
              </span>
              <input
                className={`${FIELD} max-w-40`}
                value={draft.tolerance}
                disabled={locked}
                inputMode="decimal"
                placeholder="0.1"
                onChange={(event) =>
                  onChange((current) => ({ ...current, tolerance: event.target.value }))
                }
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {draft.type === "matching" ? (
        <div className="flex flex-col gap-2.5">
          {draft.pairs.map((pair) => (
            <div key={pair.key} className="flex items-center gap-2.5">
              <input
                className={FIELD}
                value={pair.left}
                disabled={locked}
                placeholder={t("editor.pairLeft")}
                onChange={(event) => setPair(pair.key, "left", event.target.value)}
              />
              <Icon name="arrow-forward" size={18} className="shrink-0 text-icon-tertiary" />
              <input
                className={FIELD}
                value={pair.right}
                disabled={locked}
                placeholder={t("editor.pairRight")}
                onChange={(event) => setPair(pair.key, "right", event.target.value)}
              />
              <button
                type="button"
                className={ROW_BUTTON}
                disabled={locked || draft.pairs.length <= 2}
                aria-label={t("editor.removePair")}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    pairs: current.pairs.filter((item) => item.key !== pair.key),
                  }))
                }
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className={ADD_BUTTON}
            disabled={locked}
            onClick={() =>
              onChange((current) => ({
                ...current,
                pairs: [...current.pairs, { key: newKey(), left: "", right: "" }],
              }))
            }
          >
            <Icon name="add" size={16} /> {t("editor.addPair")}
          </button>

          <small className="text-body-xs text-ink-tertiary">{t("editor.matchingHint")}</small>
        </div>
      ) : null}

      {draft.type === "ordering" ? (
        <div className="flex flex-col gap-2.5">
          {draft.options.map((option, optionIndex) => (
            <div key={option.key} className="flex items-center gap-2.5 rounded-md bg-subtle px-3">
              <Icon name="drag-indicator" size={18} className="shrink-0 text-icon-tertiary" />
              <span className="shrink-0 text-body text-ink-tertiary">{optionIndex + 1}.</span>
              <input
                className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
                value={option.text}
                disabled={locked}
                placeholder={t("editor.itemPlaceholder")}
                onChange={(event) => setOption(option.key, event.target.value)}
              />
              <button
                type="button"
                className={ROW_BUTTON}
                disabled={locked || draft.options.length <= 2}
                aria-label={t("editor.removeOption")}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    options: current.options.filter((item) => item.key !== option.key),
                  }))
                }
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className={ADD_BUTTON}
            disabled={locked || draft.options.length >= MAX_OPTIONS}
            onClick={() =>
              onChange((current) => ({
                ...current,
                options: [...current.options, { key: newKey(), text: "" }],
              }))
            }
          >
            <Icon name="add" size={16} /> {t("editor.addItem")}
          </button>
        </div>
      ) : null}

      {draft.type === "fill_blank" ? (
        <small className="text-body-xs text-ink-tertiary">{t("editor.blankHint")}</small>
      ) : null}

      {draft.type === "essay" ? (
        <label className="flex items-center gap-2.5">
          <span className="shrink-0 text-body-xs text-ink-secondary">{t("editor.minWords")}</span>
          <input
            className={`${FIELD} max-w-40`}
            value={draft.minWords}
            disabled={locked}
            inputMode="numeric"
            onChange={(event) =>
              onChange((current) => ({ ...current, minWords: event.target.value }))
            }
          />
        </label>
      ) : null}
    </article>
  );
}

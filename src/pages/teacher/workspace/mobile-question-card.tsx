import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  MAX_OPTIONS,
  QUESTION_TYPE_ORDER,
  changeDraftType,
  optionLetter,
  type KeyFactory,
  type QuestionDraft,
} from "@/modules/quiz";
import type { QuizQuestionType } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";

export interface MobileQuestionCardProps {
  draft: QuestionDraft;
  index: number;
  locked: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
}

const FIELD =
  "h-11 w-full min-w-0 rounded-lg border-[1.5px] border-transparent bg-subtle px-4 text-title text-ink outline-none transition-colors placeholder:font-normal placeholder:text-ink-tertiary focus:border-focus disabled:opacity-70";

const LINK =
  "flex h-6 w-fit items-center gap-2 pl-1 text-title-sm text-brand transition-colors hover:text-brand-strong disabled:opacity-40";

const REMOVE = "grid size-9 shrink-0 place-items-center rounded-full text-icon-secondary transition-colors hover:bg-subtle disabled:opacity-40";

const BLANK = /\{\{([^{}]*)\}\}/g;

function toBrackets(text: string): string {
  return text.replace(BLANK, (_match, inner: string) => `[${inner.split("|").map((part) => part.trim()).join("|")}]`);
}

function fromBrackets(text: string): string {
  return text.replace(/\[([^[\]]*)\]/g, "{{$1}}");
}

export function AutoTextarea({
  value,
  className,
  onChange,
  ...rest
}: {
  value: string;
  className: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
      value={value}
      placeholder={rest.placeholder}
      disabled={rest.disabled}
      aria-label={rest.ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="relative flex h-7 shrink-0 items-center gap-1 rounded-full bg-subtle px-2.5 text-caption-strong text-ink">
      {children}
    </span>
  );
}

export function MobileQuestionCard({ draft, index, locked, newKey, onChange, onRemove }: MobileQuestionCardProps) {
  const { t } = useTranslation("quiz");
  const unit = draft.type === "essay" ? t("editor.mobile.band") : t("editor.points");

  function setOption(key: string, text: string) {
    onChange((current) => ({
      ...current,
      options: current.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
  }

  function dropEmptyOption(key: string) {
    if (draft.options.length <= 2 || draft.options.find((option) => option.key === key)?.text.trim()) return;
    onChange((current) => ({
      ...current,
      options: current.options.filter((option) => option.key !== key),
      correctKeys: current.correctKeys.filter((item) => item !== key),
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

  return (
    <article className="flex flex-col rounded-xl bg-surface px-4 pt-3.5 pb-4" data-question-index={index}>
      <div className="flex h-7 items-center gap-1.5">
        <Dropdown>
          <DropdownTrigger asChild>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-body-sm font-medium text-ink-secondary"
              disabled={locked}
            >
              {t("editor.questionNumber", { number: index + 1 })}
            </button>
          </DropdownTrigger>
          <DropdownContent align="start">
            {(draft.type === "single" || draft.type === "multiple") && draft.options.length < MAX_OPTIONS ? (
              <DropdownItem
                onSelect={() =>
                  onChange((current) => ({ ...current, options: [...current.options, { key: newKey(), text: "" }] }))
                }
              >
                {t("editor.addOption")}
              </DropdownItem>
            ) : null}
            <DropdownItem destructive onSelect={onRemove}>
              {t("editor.removeQuestion")}
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <Pill>
          {t(`editor.mobile.types.${draft.type}`)}
          <Icon name="chevron-down" size={14} className="shrink-0 text-ink-secondary" />
          <select
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
            value={draft.type}
            disabled={locked}
            aria-label={t("editor.mobile.typeAria")}
            onChange={(event) =>
              onChange((current) => changeDraftType(current, event.target.value as QuizQuestionType, newKey))
            }
          >
            {QUESTION_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {t(`editor.mobile.types.${type}`)}
              </option>
            ))}
          </select>
        </Pill>

        <Pill>
          <input
            className="min-w-0 bg-transparent text-right text-caption-strong outline-none"
            style={{ width: `${Math.max(1, draft.points.length)}ch` }}
            value={draft.points}
            inputMode="numeric"
            disabled={locked}
            aria-label={t("editor.mobile.pointsAria")}
            onChange={(event) =>
              onChange((current) => ({ ...current, points: event.target.value.replace(/\D/g, "").slice(0, 3) }))
            }
          />
          {unit}
        </Pill>
      </div>

      {draft.type === "fill_blank" ? (
        <p className="mt-[7px] text-body text-ink">{t("editor.mobile.blankInstruction")}</p>
      ) : (
        <AutoTextarea
          className="mt-[7px] w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary disabled:opacity-80"
          value={draft.text}
          placeholder={t("editor.questionPlaceholder")}
          disabled={locked}
          ariaLabel={t("editor.questionPlaceholder")}
          onChange={(text) => onChange((current) => ({ ...current, text }))}
        />
      )}

      {draft.type === "single" || draft.type === "multiple" ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {draft.options.map((option, optionIndex) => {
            const correct = draft.correctKeys.includes(option.key);
            return (
              <div
                key={option.key}
                className={`flex h-13 items-center gap-3 rounded-lg px-3.5 transition-colors ${
                  correct ? "border-[1.5px] border-success bg-success-bg" : "border border-line bg-surface"
                }`}
              >
                <button
                  type="button"
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-caption-strong transition-colors ${
                    correct ? "bg-success-fg text-on-action" : "bg-subtle text-ink-secondary"
                  }`}
                  disabled={locked}
                  aria-pressed={correct}
                  aria-label={t("editor.mobile.markCorrect", { letter: optionLetter(optionIndex) })}
                  onClick={() => toggleCorrect(option.key)}
                >
                  {optionLetter(optionIndex)}
                </button>
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
                  value={option.text}
                  disabled={locked}
                  placeholder={t("editor.optionPlaceholder", { letter: optionLetter(optionIndex) })}
                  onChange={(event) => setOption(option.key, event.target.value)}
                  onBlur={() => dropEmptyOption(option.key)}
                />
                {correct ? <Icon name="check-circle" size={22} className="shrink-0 text-success" /> : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {draft.type === "true_false" ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {[true, false].map((value, optionIndex) => {
            const correct = draft.correctBool === value;
            return (
              <button
                key={String(value)}
                type="button"
                disabled={locked}
                aria-pressed={correct}
                className={`flex h-13 items-center gap-3 rounded-lg px-3.5 text-left transition-colors ${
                  correct ? "border-[1.5px] border-success bg-success-bg" : "border border-line bg-surface"
                }`}
                onClick={() => onChange((current) => ({ ...current, correctBool: value }))}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-caption-strong ${
                    correct ? "bg-success-fg text-on-action" : "bg-subtle text-ink-secondary"
                  }`}
                >
                  {optionLetter(optionIndex)}
                </span>
                <span className="min-w-0 flex-1 text-body text-ink">
                  {value ? t("editor.mobile.yes") : t("editor.mobile.no")}
                </span>
                {correct ? <Icon name="check-circle" size={22} className="shrink-0 text-success" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {draft.type === "numeric" ? (
        <div className="mt-3 flex flex-col">
          <div className="flex gap-2.5">
            <input
              className={`${FIELD} h-12 flex-1`}
              value={draft.acceptedAnswers[0] ?? ""}
              disabled={locked}
              inputMode="decimal"
              placeholder={t("editor.answerPlaceholder")}
              aria-label={t("editor.answerPlaceholder")}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  acceptedAnswers: [event.target.value, ...current.acceptedAnswers.slice(1)],
                }))
              }
            />
            <label className="flex h-12 w-27.5 shrink-0 items-center gap-3 rounded-lg border-[1.5px] border-transparent bg-subtle px-4 transition-colors focus-within:border-focus">
              <span className="text-title text-ink">±</span>
              <i className="h-4.5 w-px shrink-0 bg-line-strong not-italic" aria-hidden="true" />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-title text-ink outline-none placeholder:text-ink"
                value={draft.tolerance}
                disabled={locked}
                inputMode="decimal"
                placeholder="0"
                aria-label={t("editor.tolerance")}
                onChange={(event) => onChange((current) => ({ ...current, tolerance: event.target.value }))}
              />
            </label>
          </div>
          <small className="mt-2.5 text-caption font-normal text-ink-secondary">{t("editor.mobile.numericHint")}</small>
        </div>
      ) : null}

      {draft.type === "text" ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {draft.acceptedAnswers.map((answer, answerIndex) => (
            <div key={answerIndex} className="flex items-center gap-2">
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
                className={REMOVE}
                disabled={locked || draft.acceptedAnswers.length <= 1}
                aria-label={t("editor.removeAnswer")}
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    acceptedAnswers: current.acceptedAnswers.filter((_, position) => position !== answerIndex),
                  }))
                }
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          ))}
          {!locked ? (
            <button
              type="button"
              className={LINK}
              onClick={() => onChange((current) => ({ ...current, acceptedAnswers: [...current.acceptedAnswers, ""] }))}
            >
              <Icon name="add" size={18} /> {t("editor.addAnswer")}
            </button>
          ) : null}
        </div>
      ) : null}

      {draft.type === "matching" ? (
        <div className="mt-3 flex flex-col">
          <div className="flex flex-col gap-2.5">
          {draft.pairs.map((pair) => (
            <div key={pair.key} className="flex items-center gap-2.5">
              <input
                className={`${FIELD} font-semibold`}
                value={pair.left}
                disabled={locked}
                placeholder={t("editor.pairLeft")}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    pairs: current.pairs.map((item) => (item.key === pair.key ? { ...item, left: event.target.value } : item)),
                  }))
                }
              />
              <Icon name="arrow-forward" size={18} className="shrink-0 text-brand" />
              <input
                className={`${FIELD} font-semibold`}
                value={pair.right}
                disabled={locked}
                placeholder={t("editor.pairRight")}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    pairs: current.pairs.map((item) => (item.key === pair.key ? { ...item, right: event.target.value } : item)),
                  }))
                }
              />
              <button
                type="button"
                className={REMOVE}
                disabled={locked || draft.pairs.length <= 2}
                aria-label={t("editor.removePair")}
                onClick={() =>
                  onChange((current) => ({ ...current, pairs: current.pairs.filter((item) => item.key !== pair.key) }))
                }
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          ))}
          </div>
          {!locked ? (
            <button
              type="button"
              className={`${LINK} mt-3`}
              onClick={() =>
                onChange((current) => ({ ...current, pairs: [...current.pairs, { key: newKey(), left: "", right: "" }] }))
              }
            >
              <Icon name="add" size={18} /> {t("editor.addPair")}
            </button>
          ) : null}
          <small className="mt-1 text-caption font-normal text-ink-secondary">{t("editor.matchingHint")}</small>
        </div>
      ) : null}

      {draft.type === "ordering" ? (
        <OrderingList draft={draft} locked={locked} newKey={newKey} onChange={onChange} />
      ) : null}

      {draft.type === "fill_blank" ? (
        <BlankEditor draft={draft} locked={locked} onChange={onChange} />
      ) : null}

      {draft.type === "essay" ? (
        <label className="mt-3 flex items-center gap-3">
          <span className="min-w-0 flex-1 text-body-sm text-ink-secondary">{t("editor.mobile.minWords")}</span>
          <input
            className="h-10 w-22.5 shrink-0 rounded-lg border-[1.5px] border-transparent bg-subtle px-3 text-center text-title text-ink outline-none focus:border-focus"
            value={draft.minWords}
            disabled={locked}
            inputMode="numeric"
            onChange={(event) =>
              onChange((current) => ({ ...current, minWords: event.target.value.replace(/\D/g, "").slice(0, 4) }))
            }
          />
        </label>
      ) : null}
    </article>
  );
}

function OrderingList({
  draft,
  locked,
  newKey,
  onChange,
}: {
  draft: QuestionDraft;
  locked: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
}) {
  const { t } = useTranslation("quiz");
  const listRef = useRef<HTMLDivElement>(null);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, from: number) {
    if (locked) return;
    event.preventDefault();
    const list = listRef.current;
    if (!list) return;
    let position = from;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => {
      const rows = [...list.children].filter((child) => child instanceof HTMLElement && child.dataset.row) as HTMLElement[];
      const next = rows.findIndex((row) => {
        const rect = row.getBoundingClientRect();
        return moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom;
      });
      if (next >= 0 && next !== position) {
        const swapFrom = position;
        onChange((current) => {
          const options = [...current.options];
          const [item] = options.splice(swapFrom, 1);
          options.splice(next, 0, item);
          return { ...current, options };
        });
        position = next;
      }
    };
    const stop = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", stop);
      target.removeEventListener("pointercancel", stop);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  }

  return (
    <div ref={listRef} className="mt-3 flex flex-col gap-2.5">
      {draft.options.map((option, optionIndex) => (
        <div key={option.key} data-row="true" className="flex h-16 items-center gap-2 rounded-lg bg-subtle pr-2 pl-2.5">
          <button
            type="button"
            className="grid h-9 w-6 shrink-0 cursor-grab touch-none place-items-center text-icon-secondary"
            aria-label={t("editor.mobile.dragItem")}
            onPointerDown={(event) => startDrag(event, optionIndex)}
          >
            <Icon name="drag-indicator" size={20} />
          </button>
          <span className="shrink-0 text-title text-ink">{optionIndex + 1}.</span>
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-title text-ink outline-none placeholder:font-normal placeholder:text-ink-tertiary"
            value={option.text}
            disabled={locked}
            placeholder={t("editor.itemPlaceholder")}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                options: current.options.map((item) => (item.key === option.key ? { ...item, text: event.target.value } : item)),
              }))
            }
          />
          <button
            type="button"
            className={REMOVE}
            disabled={locked || draft.options.length <= 2}
            aria-label={t("editor.removeOption")}
            onClick={() =>
              onChange((current) => ({ ...current, options: current.options.filter((item) => item.key !== option.key) }))
            }
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      ))}
      {!locked && draft.options.length < MAX_OPTIONS ? (
        <button
          type="button"
          className={LINK}
          onClick={() => onChange((current) => ({ ...current, options: [...current.options, { key: newKey(), text: "" }] }))}
        >
          <Icon name="add" size={18} /> {t("editor.addItem")}
        </button>
      ) : null}
    </div>
  );
}

function BlankEditor({
  draft,
  locked,
  onChange,
}: {
  draft: QuestionDraft;
  locked: boolean;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
}) {
  const { t } = useTranslation("quiz");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const text = toBrackets(draft.text);
  const parts = text.split(/(\[[^[\]]*\])/g);

  function update(next: string) {
    onChange((current) => ({ ...current, text: fromBrackets(next) }));
  }

  function addBlank() {
    const element = areaRef.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const selected = text.slice(start, end) || t("editor.mobile.blankAnswer");
    update(`${text.slice(0, start)}[${selected}]${text.slice(end)}`);
  }

  return (
    <div className="mt-3 flex flex-col">
      <div className="relative rounded-lg bg-subtle px-3 py-3 text-body text-ink">
        <div className="pointer-events-none break-words whitespace-pre-wrap" aria-hidden="true">
          {parts.map((part, partIndex) =>
            part.startsWith("[") ? (
              <span key={partIndex} className="text-brand">
                {part}
              </span>
            ) : (
              <span key={partIndex}>{part}</span>
            )
          )}
          {text.endsWith("\n") || !text ? "​" : null}
        </div>
        <textarea
          ref={areaRef}
          rows={1}
          className="absolute inset-0 resize-none overflow-hidden bg-transparent px-3 py-3 text-body break-words whitespace-pre-wrap text-transparent caret-ink outline-none placeholder:text-ink-tertiary"
          value={text}
          disabled={locked}
          placeholder={t("editor.mobile.blankPlaceholder")}
          aria-label={t("editor.mobile.blankPlaceholder")}
          onChange={(event) => update(event.target.value)}
        />
      </div>
      {!locked ? (
        <button type="button" className={`${LINK} mt-2.5`} onClick={addBlank}>
          <Icon name="add" size={18} /> {t("editor.mobile.addBlank")}
        </button>
      ) : null}
      <small className="mt-1.5 text-caption font-normal text-ink-secondary">{t("editor.mobile.blankHint")}</small>
    </div>
  );
}

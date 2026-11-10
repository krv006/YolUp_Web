import { useTranslation } from "react-i18next";
import type { HomeworkQuestion } from "@/shared/types";
import { isAnswered, type AnswerDraft } from "../lib/homework-answers";

const FIELD =
  "w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface disabled:opacity-60";

export function QuestionsAnswerForm({
  questions,
  value,
  onChange,
  disabled = false,
}: {
  questions: HomeworkQuestion[];
  value: AnswerDraft;
  onChange: (value: AnswerDraft) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("homework");
  const answered = questions.filter((question) => isAnswered(value[question.id])).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <strong className="flex-1 text-title text-ink">{t("questions.answerTitle")}</strong>
        <small className="text-caption text-ink-secondary">
          {t("questions.answered", { count: answered, total: questions.length })}
        </small>
      </div>
      {questions.map((question, index) => {
        const current = value[question.id];
        const picked = Array.isArray(current) ? current : [];
        const name = `question-${question.id}`;
        return (
          <fieldset key={question.id} className="flex flex-col gap-2.5 rounded-xl border border-line p-4" disabled={disabled}>
            <legend className="sr-only">{t("questions.number", { n: index + 1 })}</legend>
            <div className="flex items-start gap-2">
              <strong className="text-title-sm text-brand">{index + 1}.</strong>
              <p className="min-w-0 flex-1 text-body text-ink break-words whitespace-pre-wrap">{question.text}</p>
              <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-caption-strong text-ink-secondary">
                {t("questions.pointsValue", { count: question.points })}
              </span>
            </div>
            {question.type === "single" || question.type === "multiple" ? (
              <div className="flex flex-col gap-1.5">
                {question.type === "multiple" ? (
                  <small className="text-caption text-ink-tertiary">{t("questions.pickMany")}</small>
                ) : null}
                {question.options.map((option, optionIndex) => {
                  const checked = picked.includes(optionIndex);
                  return (
                    <label
                      key={optionIndex}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-subtle px-3.5 py-2 has-[:checked]:bg-brand-subtle"
                    >
                      <input
                        type={question.type === "single" ? "radio" : "checkbox"}
                        name={name}
                        className="size-4.5 shrink-0 accent-brand"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            ...value,
                            [question.id]:
                              question.type === "single"
                                ? [optionIndex]
                                : checked
                                  ? picked.filter((item) => item !== optionIndex)
                                  : [...picked, optionIndex].sort((a, b) => a - b),
                          })
                        }
                      />
                      <span className="text-body text-ink">{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : question.type === "short" ? (
              <input
                className={`${FIELD} h-12`}
                maxLength={500}
                value={typeof current === "string" ? current : ""}
                placeholder={t("questions.shortPlaceholder")}
                onChange={(event) => onChange({ ...value, [question.id]: event.target.value })}
              />
            ) : (
              <textarea
                rows={5}
                maxLength={10000}
                className={`${FIELD} resize-y py-3`}
                value={typeof current === "string" ? current : ""}
                placeholder={t("questions.longPlaceholder")}
                onChange={(event) => onChange({ ...value, [question.id]: event.target.value })}
              />
            )}
          </fieldset>
        );
      })}
    </section>
  );
}

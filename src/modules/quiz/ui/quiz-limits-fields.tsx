import { useTranslation } from "react-i18next";
import {
  QUIZ_ATTEMPTS_MAX,
  QUIZ_TIME_LIMIT_MAX,
  type QuizLimitField,
  type QuizLimitsDraft,
} from "../lib/quiz-limits";

export interface QuizLimitsFieldsProps {
  value: QuizLimitsDraft;
  onChange: (value: QuizLimitsDraft) => void;
  invalid: readonly QuizLimitField[];
  questionCount: number;
  hasGroups: boolean;
  compact?: boolean;
}

export function QuizLimitsFields({
  value,
  onChange,
  invalid,
  questionCount,
  hasGroups,
  compact = false,
}: QuizLimitsFieldsProps) {
  const { t } = useTranslation("quiz");
  const fields: Array<{ id: QuizLimitField; max: number; placeholder: string }> = [
    { id: "time", max: QUIZ_TIME_LIMIT_MAX, placeholder: compact ? "—" : t("limits.none") },
    { id: "attempts", max: QUIZ_ATTEMPTS_MAX, placeholder: compact ? "—" : t("limits.none") },
    {
      id: "perAttempt",
      max: Math.max(questionCount, 1),
      placeholder: compact ? String(questionCount) : t("limits.allQuestions", { count: questionCount }),
    },
  ];

  return (
    <section className="flex flex-col gap-2.5">
      <span className="flex flex-col gap-0.5">
        <strong className={compact ? "text-body-sm font-medium text-ink" : "text-body-xs text-ink-secondary"}>
          {t("limits.title")}
        </strong>
        <small className="text-caption text-ink-tertiary">{t("limits.hint")}</small>
      </span>
      <div className="grid grid-cols-3 gap-2">
        {fields.map((field) => {
          const wrong = invalid.includes(field.id);
          const locked = field.id === "perAttempt" && hasGroups;
          return (
            <label key={field.id} className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-caption text-ink-secondary">{t(`limits.${field.id}`)}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={field.max}
                disabled={locked}
                aria-invalid={wrong}
                className={`w-full min-w-0 border bg-subtle px-3 text-body text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:bg-surface disabled:opacity-50 ${
                  compact ? "h-12 rounded-lg" : "h-11 rounded-md"
                } ${wrong ? "border-danger" : "border-transparent focus:border-focus"}`}
                value={locked ? "" : value[field.id]}
                placeholder={field.placeholder}
                onChange={(event) => onChange({ ...value, [field.id]: event.target.value })}
              />
            </label>
          );
        })}
      </div>
      {invalid.length ? (
        <small className="text-caption text-danger" role="alert">
          {invalid
            .map((field) => t(`limits.range.${field}`, { max: field === "perAttempt" ? questionCount : undefined }))
            .join(" · ")}
        </small>
      ) : null}
      {hasGroups ? <small className="text-caption text-ink-tertiary">{t("limits.groupedHint")}</small> : null}
    </section>
  );
}

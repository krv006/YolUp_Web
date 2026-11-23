import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HOMEWORK_TYPE_OF_QUIZ, quizQuestionsToDrafts, type DraftQuestion } from "@/modules/homework";
import { useQuiz, useQuizzes } from "@/modules/quiz";
import type { QuizQuestionType, QuizSummary } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

export interface PickedQuiz {
  quizId: string;
  title: string;
  drafts: DraftQuestion[];
}

/**
 * «Testlardan tanlash»: o'qituvchining tayyor testlaridan savollarni vazifaga NUSXALAB olish. Nimalar qanday turga
 * o'tishi va nimalar tushib qolishi oldindan ko'rsatiladi.
 */
export function HomeworkTestPicker({ added, onAdd, onRemove }: {
  added: Array<{ quizId: string; title: string }>;
  onAdd: (picked: PickedQuiz) => void;
  onRemove: (quizId: string) => void;
}) {
  const { t } = useTranslation("homework");
  const quizzes = useQuizzes(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<QuizSummary | null>(null);
  const detail = useQuiz(selected?.id ?? null);
  const [unchecked, setUnchecked] = useState<Set<number>>(new Set());

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (quizzes.data ?? []).filter(
      (quiz) => !needle || `${quiz.title} ${quiz.subjectLabel} ${quiz.topic}`.toLowerCase().includes(needle)
    );
  }, [quizzes.data, query]);

  const trueLabel = t("picker.true");
  const falseLabel = t("picker.false");
  const labels = useMemo(() => ({ trueLabel, falseLabel }), [trueLabel, falseLabel]);
  const questions = useMemo(() => detail.data?.questions ?? [], [detail.data]);
  const conversion = useMemo(() => quizQuestionsToDrafts(questions, labels, undefined), [questions, labels]);
  const takenIndexes = useMemo(
    () => new Set(questions.flatMap((question, index) => (HOMEWORK_TYPE_OF_QUIZ[question.type] && !unchecked.has(index) ? [index] : []))),
    [questions, unchecked]
  );
  const chosen = useMemo(() => quizQuestionsToDrafts(questions, labels, takenIndexes), [questions, takenIndexes, labels]);
  const byType = useMemo(() => {
    const counts = new Map<QuizQuestionType, number>();
    for (const question of questions) counts.set(question.type, (counts.get(question.type) ?? 0) + 1);
    return Array.from(counts.entries());
  }, [questions]);
  const skippedTotal = Object.values(conversion.skipped).reduce((sum, count) => sum + (count ?? 0), 0);
  const skippedTypes = Object.entries(conversion.skipped)
    .map(([type, count]) => `${t(`picker.types.${type}`)} ${count}`)
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-title-lg font-semibold text-ink">{t("picker.title")}</h2>
        <p className="text-body-sm text-ink-secondary">{t("picker.lead")}</p>
      </div>

      {added.length ? (
        <div className="flex flex-wrap gap-2">
          {added.map((item) => (
            <span key={item.quizId} className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle py-1 pr-1.5 pl-3 text-body-xs text-brand-strong">
              {item.title} — {t("picker.added")}
              <button type="button" aria-label={t("picker.remove")} className="grid size-5 place-items-center rounded-full hover:bg-surface" onClick={() => onRemove(item.quizId)}>
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <label className="flex items-center gap-2 border-b border-line bg-subtle px-3 py-2">
            <Icon name="search" size={18} className="text-ink-tertiary" />
            <input
              className="h-9 min-w-0 flex-1 bg-transparent text-body-sm outline-none placeholder:text-ink-tertiary"
              value={query}
              placeholder={t("picker.search")}
              aria-label={t("picker.search")}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {quizzes.isLoading ? <p className="p-4 text-body-sm text-ink-tertiary">{t("picker.loading")}</p> : null}
          {!quizzes.isLoading && !list.length ? <p className="p-4 text-body-sm text-ink-tertiary">{t("picker.empty")}</p> : null}
          {list.map((quiz) => (
            <button
              key={quiz.id}
              type="button"
              className={`flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left first:border-t-0 hover:bg-canvas ${selected?.id === quiz.id ? "bg-brand-subtle" : ""}`}
              onClick={() => {
                setSelected(quiz);
                setUnchecked(new Set());
              }}
            >
              <span className="min-w-0 flex-1">
                <b className="block truncate text-body font-medium">{quiz.title || quiz.topic || "—"}</b>
                <small className="block truncate text-body-xs text-ink-tertiary">{quiz.subjectLabel} · {t("picker.questions", { count: quiz.questionCount })}</small>
              </span>
            </button>
          ))}
        </div>

        {!selected ? (
          <div className="rounded-2xl border border-line bg-surface p-5 text-body-sm text-ink-tertiary">{t("picker.pickPrompt")}</div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
            <b className="text-title-sm text-ink">{t("picker.preview", { title: selected.title })}</b>
            {detail.isLoading ? <p className="text-body-sm text-ink-tertiary">{t("picker.loading")}</p> : null}
            {detail.data ? (
              <>
                <table className="w-full text-body-xs">
                  <tbody>
                    {byType.map(([type, count]) => {
                      const target = HOMEWORK_TYPE_OF_QUIZ[type];
                      return (
                        <tr key={type} className="border-t border-line first:border-t-0">
                          <td className={`py-1.5 ${target ? "" : "text-ink-tertiary"}`}>{t(`picker.types.${type}`)} — {count}</td>
                          <td className={`py-1.5 text-right ${target ? "text-ink-secondary" : "text-warning-fg"}`}>
                            {target ? `→ ${t(`picker.homeworkTypes.${target}`)}` : t("picker.skippedShort")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {skippedTotal ? (
                  <p className="flex gap-2 rounded-lg bg-warning-bg px-3 py-2 text-body-xs text-warning-fg">
                    <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                    <span>{t("picker.skippedWarn", { count: skippedTotal, types: skippedTypes })}</span>
                  </p>
                ) : null}
                {conversion.withImage ? (
                  <p className="text-body-xs text-ink-tertiary">{t("picker.imagesDropped", { count: conversion.withImage })}</p>
                ) : null}

                <div className="flex max-h-72 flex-col gap-1 overflow-auto">
                  {questions.map((question, index) => {
                    if (!HOMEWORK_TYPE_OF_QUIZ[question.type]) return null;
                    return (
                      <label key={question.id} className="flex items-start gap-2 py-1 text-body-xs">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={!unchecked.has(index)}
                          onChange={(event) =>
                            setUnchecked((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.delete(index);
                              else next.add(index);
                              return next;
                            })
                          }
                        />
                        <span className="min-w-0 flex-1">{question.text || "—"}</span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="mt-1 inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-brand px-5 text-button text-ink-inverse hover:bg-brand-strong disabled:opacity-40"
                  disabled={!chosen.drafts.length}
                  onClick={() => onAdd({ quizId: selected.id, title: selected.title, drafts: chosen.drafts })}
                >
                  <Icon name="add" size={18} /> {t("picker.add", { count: chosen.drafts.length })}
                </button>
                {!conversion.drafts.length ? <p className="text-body-xs text-ink-tertiary">{t("picker.nothing")}</p> : null}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

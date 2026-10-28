import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourse } from "@/modules/course";
import {
  MathText,
  QuestionAnswerInput,
  QuizGroupPanel,
  emptyAnswer,
  optionLetter,
  quizDisplayTitle,
  useQuiz,
  useSubmitQuizAttempt,
} from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { QuizAnswerValue, QuizDetail, QuizQuestion } from "@/shared/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileEmptyCard, mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";

interface Draft {
  answers: Record<string, QuizAnswerValue>;
  index: number;
  startedAt: number;
}

const draftKey = (quizId: string) => `yolup.quiz-draft.${quizId}`;

function readDraft(quizId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(quizId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(quizId: string, draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(draftKey(quizId), JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey(quizId));
  } catch {
    return;
  }
}

function answered(value: QuizAnswerValue | undefined): boolean {
  if (!value) return false;
  switch (value.type) {
    case "single":
      return value.optionId !== null;
    case "multiple":
      return value.optionIds.length > 0;
    case "true_false":
      return value.value !== null;
    case "matching":
      return Object.keys(value.pairs).length > 0;
    case "ordering":
      return true;
    case "fill_blank":
      return value.values.some((item) => item.trim());
    default:
      return Boolean(value.value.trim());
  }
}

export function StudentTestPage() {
  const { quizId = "" } = useParams();
  const quiz = useQuiz(quizId || null);
  const { t } = useTranslation("student");

  if (quiz.isError)
    return (
      <main className="grid h-full place-items-center bg-canvas bg-page-gradient p-6">
        <MobileEmptyCard
          icon="quiz"
          title={t("workspace.player.loadError")}
          action={{ label: t("workspace.player.retry"), onClick: () => void quiz.refetch() }}
        />
      </main>
    );
  if (!quiz.data)
    return (
      <main className="flex h-full flex-col items-center gap-4 bg-canvas bg-page-gradient px-4 pt-10" aria-hidden="true">
        <i className="h-8 w-80 max-w-full rounded-full bg-skeleton" />
        <i className="h-96 w-full max-w-160 rounded-2xl bg-surface" />
      </main>
    );
  return <TestPlayer key={quiz.data.id} quiz={quiz.data} />;
}

function TestPlayer({ quiz }: { quiz: QuizDetail }) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const course = useCourse(quiz.courseId || null);
  const submit = useSubmitQuizAttempt();
  const questions = quiz.questions;
  const [draft, setDraft] = useState<Draft>(
    () => readDraft(quiz.id) ?? { answers: {}, index: 0, startedAt: Date.now() }
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const index = Math.min(draft.index, Math.max(questions.length - 1, 0));
  const question = questions[index];
  const group = question?.groupId ? quiz.groups.find((item) => item.id === question.groupId) : undefined;
  const missing = questions.filter((item) => !answered(draft.answers[item.id])).length;

  useEffect(() => writeDraft(quiz.id, draft), [quiz.id, draft]);

  useEffect(() => {
    railRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  const go = (next: number) => setDraft((current) => ({ ...current, index: Math.max(0, Math.min(next, questions.length - 1)) }));
  const setAnswer = (value: QuizAnswerValue) =>
    setDraft((current) => (question ? { ...current, answers: { ...current.answers, [question.id]: value } } : current));

  function later() {
    toast.success(t("workspace.player.savedLater"));
    navigate(ROUTES.student.tests);
  }

  function finish() {
    submit.mutate(
      {
        quizId: quiz.id,
        answers: questions.map((item) => ({ questionId: item.id, answer: draft.answers[item.id] ?? emptyAnswer(item) })),
        durationSeconds: Math.round((Date.now() - draft.startedAt) / 1000),
      },
      {
        onSuccess: (result) => {
          writeDraft(quiz.id, null);
          setConfirmOpen(false);
          toast.success(t("workspace.player.submitted"));
          navigate(ROUTES.student.testResults(quiz.id), { replace: true, state: { result } });
        },
      }
    );
  }

  const requestFinish = () => (missing ? setConfirmOpen(true) : finish());
  const meta = [course.data?.title, course.data?.teacher, t("workspace.player.meta")].filter(Boolean).join(" · ");
  const last = index === questions.length - 1;

  const body = question ? (
    <QuestionBody
      question={question}
      index={index}
      total={questions.length}
      group={group ? <QuizGroupPanel group={group} /> : null}
      value={draft.answers[question.id]}
      onChange={setAnswer}
    />
  ) : null;

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      icon="quiz"
      tone="brand"
      title={t("workspace.player.finish")}
      description={t("workspace.player.unanswered", { count: missing })}
      confirmLabel={t("workspace.player.finish")}
      cancelLabel={t("workspace.back")}
      pending={submit.isPending}
      onConfirm={finish}
    />
  );

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-5 pb-6">
          <header className="flex h-11 shrink-0 items-center gap-3">
            <button type="button" className={mobileRoundButton} aria-label={t("workspace.player.later")} onClick={later}>
              <Icon name="chevron-left" size={22} />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">{quizDisplayTitle(quiz)}</h1>
            <button
              type="button"
              className="flex h-11 shrink-0 items-center rounded-full bg-brand px-4 text-button text-on-action disabled:opacity-50"
              disabled={submit.isPending}
              onClick={requestFinish}
            >
              {submit.isPending ? t("workspace.player.submitting") : t("workspace.player.finishShort")}
            </button>
          </header>
          <div ref={railRef} className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {questions.map((item, position) => (
              <button
                key={item.id}
                type="button"
                data-index={position}
                className={`grid size-10 shrink-0 place-items-center rounded-full text-body-sm font-semibold transition-colors ${
                  position === index
                    ? "bg-brand text-on-action"
                    : answered(draft.answers[item.id])
                      ? "bg-brand-subtle text-brand"
                      : "bg-surface text-ink"
                }`}
                onClick={() => go(position)}
              >
                {position + 1}
              </button>
            ))}
          </div>
          <section className="flex shrink-0 flex-col rounded-2xl bg-surface p-4">{body}</section>
        </div>
        <MobileActionBar>
          <button type="button" className={mobileButton.secondary} disabled={index === 0} onClick={() => go(index - 1)}>
            {t("workspace.player.prev")}
          </button>
          <button
            type="button"
            className={mobileButton.primary}
            disabled={submit.isPending}
            onClick={() => (last ? requestFinish() : go(index + 1))}
          >
            {last ? t("workspace.player.finishShort") : t("workspace.player.next")}
          </button>
        </MobileActionBar>
        {confirm}
      </div>
    );

  return (
    <div className="flex h-full min-h-0 bg-canvas bg-page-gradient font-body text-ink">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-line bg-surface">
        <button
          type="button"
          className="mx-5 mt-[22px] mb-2.5 flex h-6 items-center gap-2 self-start text-title font-semibold text-ink"
          onClick={later}
        >
          <Icon name="arrow-back" size={20} />
          {t("workspace.player.questions", { count: questions.length })}
        </button>
        <div ref={railRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 pb-6">
          {questions.map((item, position) => {
            const active = position === index;
            const done = answered(draft.answers[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                data-index={position}
                className={`flex min-h-[50px] items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-colors ${
                  active ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                onClick={() => go(position)}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md text-caption-strong ${
                    active ? "bg-brand text-ink-inverse" : done ? "bg-brand-subtle text-brand" : "bg-subtle text-ink"
                  }`}
                >
                  {position + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <small className="truncate text-caption text-ink-secondary">{t(`workspace.player.types.${item.type}`)}</small>
                  <span className="truncate text-body-xs text-ink">{item.text.replace(/\{\{\d+\}\}/g, "___") || "—"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[672px] flex-col px-4 pt-6 pb-10">
          <h1 className="truncate font-heading text-[22px]/7 font-semibold text-ink">{quizDisplayTitle(quiz)}</h1>
          <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="flex h-[42px] items-center rounded-full border border-line-strong bg-surface px-[15px] text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
              onClick={later}
            >
              {t("workspace.player.later")}
            </button>
            <button
              type="button"
              className="flex h-[42px] items-center rounded-full bg-brand px-[15px] text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60"
              disabled={submit.isPending}
              onClick={requestFinish}
            >
              {submit.isPending ? t("workspace.player.submitting") : t("workspace.player.finish")}
            </button>
          </div>

          <section className="mt-[17px] flex flex-col rounded-2xl border border-line bg-surface p-4">
            {body}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-[15px] text-body-sm font-semibold text-ink transition-colors hover:bg-subtle disabled:opacity-40"
                disabled={index === 0}
                onClick={() => go(index - 1)}
              >
                <Icon name="arrow-back" size={18} />
                {t("workspace.player.prev")}
              </button>
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-full bg-brand px-[15px] text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60"
                disabled={submit.isPending}
                onClick={() => (last ? requestFinish() : go(index + 1))}
              >
                <Icon name={last ? "check" : "arrow-forward"} size={18} />
                {last ? t("workspace.player.finish") : t("workspace.player.next")}
              </button>
            </div>
          </section>
        </div>
      </main>
      {confirm}
    </div>
  );
}

function QuestionBody({
  question,
  index,
  total,
  group,
  value,
  onChange,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  group: ReactNode;
  value: QuizAnswerValue | undefined;
  onChange: (value: QuizAnswerValue) => void;
}) {
  const { t } = useTranslation("student");
  const current = value && value.type === question.type ? value : emptyAnswer(question);
  const choices =
    question.type === "true_false"
      ? [
          { id: "true", text: t("workspace.player.trueLabel") },
          { id: "false", text: t("workspace.player.falseLabel") },
        ]
      : question.type === "single" || question.type === "multiple"
        ? question.options.map((option) => ({ id: option.id, text: option.text }))
        : null;

  function selected(id: string): boolean {
    if (current.type === "single") return current.optionId === id;
    if (current.type === "multiple") return current.optionIds.includes(id);
    if (current.type === "true_false") return current.value === (id === "true");
    return false;
  }

  function pick(id: string) {
    if (current.type === "single") onChange({ type: "single", optionId: id });
    else if (current.type === "multiple")
      onChange({
        type: "multiple",
        optionIds: current.optionIds.includes(id) ? current.optionIds.filter((item) => item !== id) : [...current.optionIds, id],
      });
    else if (current.type === "true_false") onChange({ type: "true_false", value: id === "true" });
  }

  return (
    <>
      <small className="text-caption-strong text-ink-secondary uppercase">
        {t("workspace.player.overline", { n: index + 1, type: t(`workspace.player.types.${question.type}`) })}
      </small>
      <p className="mt-3 text-body-xs text-ink-secondary">{t(`workspace.player.hints.${question.type}`)}</p>
      <div className="mt-3 flex items-center gap-2">
        <small className="shrink-0 text-body-xs font-semibold text-ink">
          {index + 1} / {total}
        </small>
        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
          <span className="block h-full rounded-full bg-brand" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </span>
      </div>
      {group ? <div className="mt-4">{group}</div> : null}
      {question.type === "fill_blank" ? null : (
        <div className="mt-4 text-[17px]/6 font-semibold text-ink">
          <MathText text={question.text} />
        </div>
      )}
      {choices ? (
        <div className="mt-3 flex flex-col gap-3" role={question.type === "multiple" ? "group" : "radiogroup"}>
          {choices.map((choice, position) => {
            const active = selected(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                role={question.type === "multiple" ? "checkbox" : "radio"}
                aria-checked={active}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle ring-1 ring-brand" : "border-line-strong bg-surface hover:bg-subtle"
                }`}
                onClick={() => pick(choice.id)}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-body-xs font-semibold ${
                    active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary"
                  }`}
                >
                  {optionLetter(position)}
                </span>
                <span className="min-w-0 flex-1 text-title text-ink">
                  <MathText text={choice.text} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <QuestionAnswerInput question={question} number={index + 1} value={current} onChange={onChange} />
        </div>
      )}
    </>
  );
}

import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourse } from "@/modules/course";
import { quizDisplayTitle, useQuiz, useQuizAttempts, useQuizQuestionStats, useStartAiMiniQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { QuizAttemptResult } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileEmptyCard, MobilePageHeader, mobileButton } from "@/shared/ui/mobile-page";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { shortDateTime } from "../lib/format";

function percentOf(attempt: QuizAttemptResult): number {
  return attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
}

function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function StudentTestResultsPage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { quizId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompact = useIsCompact();
  const quiz = useQuiz(quizId || null);
  const course = useCourse(quiz.data?.courseId || null);
  const attempts = useQuizAttempts(quizId || null);
  const practice = useStartAiMiniQuiz();
  const questionStats = useQuizQuestionStats(quizId || null);
  const wrongRate = new Map((questionStats.data ?? []).map((item) => [item.questionId, item.wrongRate]));

  const fresh = (location.state as { result?: QuizAttemptResult } | null)?.result ?? null;
  const rows = [...(attempts.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = fresh ?? rows[0] ?? null;
  const answers = latest?.answers.length ? latest.answers : (rows.find((item) => item.answers.length)?.answers ?? []);
  const mistakes = answers.map((answer, index) => ({ answer, number: index + 1 })).filter((item) => !item.answer.isCorrect);
  const correct = latest
    ? (latest.correctCount ?? (answers.length ? answers.length - mistakes.length : null))
    : null;
  const total = latest ? (latest.questionCount ?? (answers.length || quiz.data?.questionCount || null)) : null;
  const title = quiz.data ? quizDisplayTitle(quiz.data) : "";
  const loading = attempts.isLoading || quiz.isLoading;

  const stats = [
    { id: "score", value: latest ? `${percentOf(latest)}%` : "—", tone: "text-ink" },
    { id: "correct", value: correct !== null && total ? `${correct} / ${total}` : "—", tone: "text-ink" },
    { id: "group", value: "—", tone: "text-success-fg" },
    {
      id: "time",
      value: latest?.durationSeconds ? t("workspace.results.minutes", { count: Math.max(1, Math.round(latest.durationSeconds / 60)) }) : "—",
      tone: "text-ink",
    },
  ];

  function startPractice() {
    practice.mutate(
      { quizId, wrongQuestionIds: mistakes.map((item) => item.answer.questionId) },
      { onSuccess: () => toast.success(t("workspace.results.ai.started")) }
    );
  }

  const retake = () => navigate(ROUTES.student.test(quizId));

  const table = (
    <section className="flex flex-col rounded-2xl bg-surface p-4">
      <div className="hidden h-9 items-center rounded-md bg-subtle px-5 text-caption-strong text-ink-secondary sm:grid sm:grid-cols-[minmax(0,2.5fr)_1fr_1fr_1fr_1.6fr]">
        <span>{t("workspace.results.table.attempt")}</span>
        <span>{t("workspace.results.table.number")}</span>
        <span>{t("workspace.results.table.correct")}</span>
        <span>{t("workspace.results.table.time")}</span>
        <span>{t("workspace.results.table.result")}</span>
      </div>
      {rows.map((attempt, index) => {
        const percent = percentOf(attempt);
        return (
          <div
            key={attempt.id}
            className="grid min-h-[65px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line px-1 py-3 text-body-sm text-ink last:border-b-0 sm:grid-cols-[minmax(0,2.5fr)_1fr_1fr_1fr_1.6fr] sm:px-5"
          >
            <span className="truncate">
              {shortDateTime(attempt.createdAt, months)}
              {index === 0 ? ` · ${t("workspace.results.table.last")}` : ""}
            </span>
            <span className="hidden text-ink-secondary sm:block">{rows.length - index}</span>
            <span className="hidden text-ink-secondary sm:block">
              {attempt.correctCount ?? "—"} / {attempt.questionCount ?? "—"}
            </span>
            <span className="hidden text-ink-secondary sm:block">{duration(attempt.durationSeconds)}</span>
            <span className="flex items-center gap-2">
              <span className="h-[5px] w-[70px] overflow-hidden rounded-full bg-subtle">
                <span
                  className={`block h-full rounded-full ${index === 0 ? "bg-success" : "bg-brand"}`}
                  style={{ width: `${percent}%` }}
                />
              </span>
              <strong className="text-caption-strong text-ink">{percent}%</strong>
            </span>
          </div>
        );
      })}
    </section>
  );

  const side = (
    <div className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-3">
        <strong className="text-title text-ink">{t("workspace.results.mistakes")}</strong>
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          {!answers.length ? (
            <p className="text-body-sm text-ink-secondary">{t("workspace.results.mistakesUnknown")}</p>
          ) : mistakes.length ? (
            mistakes.map(({ answer, number }) => (
              <span key={answer.questionId} className="flex flex-col gap-2">
                <span className="flex items-center gap-3">
                  <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                    {t("workspace.results.questionLabel", { n: number, text: answer.questionText.replace(/\{\{\d+\}\}/g, "___") })}
                  </small>
                  <small className="shrink-0 text-body-xs font-semibold text-error-text">{t("workspace.results.wrong")}</small>
                </span>
                {wrongRate.has(answer.questionId) ? (
                  <span className="h-[5px] overflow-hidden rounded-full bg-subtle">
                    <span
                      className="block h-full rounded-full bg-error-text"
                      style={{ width: `${wrongRate.get(answer.questionId)}%` }}
                    />
                  </span>
                ) : null}
              </span>
            ))
          ) : (
            <p className="text-body-sm text-success-fg">{t("workspace.results.noMistakes")}</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface/60 p-4">
        <strong className="flex items-center gap-2 text-body-sm font-semibold text-ink">
          <Icon name="auto-awesome" size={20} className="text-brand" />
          {t("workspace.results.ai.title")}
        </strong>
        <p className="text-body-xs text-ink">
          {mistakes.length ? t("workspace.results.ai.text", { count: mistakes.length }) : t("workspace.results.ai.textNone")}
        </p>
        {mistakes.length ? (
          <button
            type="button"
            className="flex h-[42px] items-center justify-center rounded-full bg-brand-subtle text-body-sm font-semibold text-brand transition-colors hover:bg-tint disabled:opacity-60"
            disabled={practice.isPending}
            onClick={startPractice}
          >
            {t("workspace.results.ai.start")}
          </button>
        ) : null}
      </section>
    </div>
  );

  const statCards = (
    <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.id} className="flex flex-col gap-1 rounded-2xl bg-surface px-[18px] pt-4 pb-4">
          <small className="truncate text-body-xs text-ink-secondary">{t(`workspace.results.stats.${stat.id}`)}</small>
          <strong className={`truncate font-heading text-[28px]/9 font-semibold lg:text-[32px]/10 ${stat.tone}`}>{stat.value}</strong>
        </div>
      ))}
    </div>
  );

  const empty = (
    <MobileEmptyCard
      icon="quiz"
      title={t("workspace.results.empty")}
      description={t("workspace.results.emptyHint")}
      action={{ label: t("workspace.results.solve"), onClick: retake }}
    />
  );

  const content = loading ? (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <i key={index} className="h-[93px] rounded-2xl bg-surface" />
        ))}
      </div>
      <i className="h-50 rounded-2xl bg-surface" />
    </div>
  ) : latest ? null : (
    empty
  );

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
          <MobilePageHeader title={title} backLabel={t("workspace.back")} onBack={() => navigate(ROUTES.student.tests)} />
          {content ?? (
            <>
              {statCards}
              {table}
              {side}
            </>
          )}
        </div>
        {latest ? (
          <MobileActionBar>
            <button type="button" className={mobileButton.primary} onClick={retake}>
              {t("workspace.results.retry")}
            </button>
          </MobileActionBar>
        ) : null}
      </div>
    );

  return (
    <WorkspaceShell
      eyebrow={t("workspace.results.eyebrow", { course: course.data?.title ?? quiz.data?.subjectLabel ?? "" })}
      title={title}
      action={
        latest ? (
          <button type="button" className={workspaceAction} onClick={retake}>
            {t("workspace.results.retry")}
          </button>
        ) : null
      }
    >
      {content ?? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            {statCards}
            {table}
          </div>
          {side}
        </div>
      )}
    </WorkspaceShell>
  );
}

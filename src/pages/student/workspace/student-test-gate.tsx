import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { quizDisplayTitle, useStartQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { QuizDetail } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileEmptyCard, MobilePageHeader, mobileButton } from "@/shared/ui/mobile-page";

export function TestStartScreen({ quiz, meta }: { quiz: QuizDetail; meta: string }) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const start = useStartQuiz();
  const back = () => navigate(ROUTES.student.tests);
  const rows = [
    quiz.timeLimitMinutes
      ? { id: "time", icon: "timer", text: t("workspace.player.start.time", { count: quiz.timeLimitMinutes }) }
      : null,
    quiz.maxAttempts
      ? {
          id: "attempts",
          icon: "refresh",
          text: t("workspace.player.start.attempts", {
            left: quiz.attemptsLeft ?? quiz.maxAttempts,
            total: quiz.maxAttempts,
          }),
        }
      : null,
    quiz.questionsPerAttempt
      ? { id: "questions", icon: "quiz", text: t("workspace.player.start.questions", { count: quiz.questionsPerAttempt }) }
      : null,
  ].filter((row) => row !== null);

  const card = (
    <section className="flex flex-col items-center gap-4 rounded-2xl bg-surface px-6 py-7 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent-violet-bg text-accent-violet-fg">
        <Icon name="quiz" size={28} />
      </span>
      <span className="flex max-w-full flex-col gap-1">
        <strong className="font-heading text-h3 text-ink">{quizDisplayTitle(quiz)}</strong>
        {meta ? <small className="truncate text-body-sm text-ink-secondary">{meta}</small> : null}
      </span>
      <ul className="flex w-full flex-col gap-2 text-left">
        {rows.map((row) => (
          <li key={row.id} className="flex min-h-12 items-center gap-3 rounded-xl bg-subtle px-4 py-2.5">
            <Icon name={row.icon} size={20} className="shrink-0 text-brand" />
            <span className="text-body text-ink">{row.text}</span>
          </li>
        ))}
      </ul>
      {quiz.timeLimitMinutes ? (
        <p className="flex items-start gap-2 rounded-xl bg-warning-bg px-4 py-3 text-left text-body-sm text-warning-fg">
          <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
          {t("workspace.player.start.note")}
        </p>
      ) : null}
    </section>
  );

  const startButton = (className: string) => (
    <button type="button" className={className} disabled={start.isPending} onClick={() => start.mutate(quiz.id)}>
      {start.isPending ? t("workspace.player.start.starting") : t("workspace.player.start.action")}
    </button>
  );

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6">
          <MobilePageHeader title={t("workspace.player.start.title")} backLabel={t("workspace.back")} onBack={back} />
          {card}
        </div>
        <MobileActionBar>
          <button type="button" className={mobileButton.secondary} onClick={back}>
            {t("workspace.back")}
          </button>
          {startButton(mobileButton.primary)}
        </MobileActionBar>
      </div>
    );

  return (
    <main className="flex h-full justify-center overflow-y-auto bg-canvas bg-page-gradient px-4 py-10 font-body text-ink">
      <div className="flex w-full max-w-115 flex-col gap-4">
        {card}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full border border-line-strong bg-surface text-button text-ink transition-colors hover:bg-subtle"
            onClick={back}
          >
            {t("workspace.back")}
          </button>
          {startButton(
            "flex h-12 items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60"
          )}
        </div>
      </div>
    </main>
  );
}

export function TestAttemptsOver({ quiz }: { quiz: QuizDetail }) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  return (
    <main className="grid h-full place-items-center bg-canvas bg-page-gradient p-6">
      <div className="w-full max-w-115">
        <MobileEmptyCard
          icon="lock"
          title={t("workspace.player.over.title")}
          description={t("workspace.player.over.text", { count: quiz.attemptsUsed ?? quiz.maxAttempts ?? 0 })}
          action={{ label: t("workspace.player.over.results"), onClick: () => navigate(ROUTES.student.testResults(quiz.id)) }}
        />
        <button
          type="button"
          className="mx-auto mt-4 flex h-11 items-center gap-2 rounded-full px-5 text-button text-brand transition-colors hover:bg-brand-subtle"
          onClick={() => navigate(ROUTES.student.tests)}
        >
          <Icon name="arrow-back" size={18} />
          {t("workspace.player.over.back")}
        </button>
      </div>
    </main>
  );
}

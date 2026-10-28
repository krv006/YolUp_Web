import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { quizDisplayTitle } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { QuizSummary, StudentAttemptSummary } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell, workspaceGhostAction } from "@/widgets/workspace-shell";
import { shortDateTime } from "../lib/format";
import { FilterChips } from "./filter-chips";
import { useStudentWorkspace } from "./use-student-workspace";

type Filter = "all" | "new" | "solved" | "overdue";

const FILTERS: Filter[] = ["all", "new", "solved", "overdue"];

export function StudentTestsPage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const data = useStudentWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [attemptsOpen, setAttemptsOpen] = useState(false);

  const stateOf = (quiz: QuizSummary): Exclude<Filter, "all"> =>
    data.attemptByQuiz.has(quiz.id)
      ? "solved"
      : quiz.dueAt && new Date(quiz.dueAt).getTime() < data.now.getTime()
        ? "overdue"
        : "new";
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, item) => ({
      ...acc,
      [item]: item === "all" ? data.quizzes.length : data.quizzes.filter((quiz) => stateOf(quiz) === item).length,
    }),
    { all: 0, new: 0, solved: 0, overdue: 0 }
  );
  const chips = FILTERS.map((item) => ({ id: item, label: `${t(`workspace.tests.filters.${item}`)} · ${counts[item]}` }));
  const visible = data.quizzes.filter((quiz) => filter === "all" || stateOf(quiz) === filter);
  const sections = [...new Set(visible.map((quiz) => quiz.subjectLabel || t("workspace.tests.otherSubject")))].map(
    (label) => [label, visible.filter((quiz) => (quiz.subjectLabel || t("workspace.tests.otherSubject")) === label)] as const
  );

  const cards = (
    <>
      {data.quizzesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="flex h-33 flex-col gap-4 rounded-2xl bg-surface p-4">
              <span className="flex gap-3">
                <i className="size-10 shrink-0 rounded-xl bg-skeleton" />
                <span className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                  <i className="h-3.5 w-44 max-w-full rounded-full bg-skeleton" />
                  <i className="h-3 w-28 max-w-full rounded-full bg-skeleton" />
                </span>
              </span>
              <i className="h-11 rounded-full bg-skeleton" />
            </span>
          ))}
        </div>
      ) : null}

      {sections.map(([label, rows]) => (
        <section key={label} className="flex flex-col gap-3">
          <span className="text-overline text-ink-secondary uppercase">{label}</span>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((quiz) => (
              <TestCard
                key={quiz.id}
                quiz={quiz}
                attempt={data.attemptByQuiz.get(quiz.id) ?? null}
                overdue={stateOf(quiz) === "overdue"}
                onSolve={() => navigate(ROUTES.student.test(quiz.id))}
                onResult={() => navigate(ROUTES.student.testResults(quiz.id))}
              />
            ))}
          </div>
        </section>
      ))}

      {!data.quizzesLoading && !visible.length ? (
        <MobileEmptyCard icon="quiz" title={t("workspace.tests.emptyTitle")} description={t("workspace.tests.emptyHint")} />
      ) : null}
    </>
  );

  const dialog = (
    <AttemptsDialog
      open={attemptsOpen}
      onOpenChange={setAttemptsOpen}
      attempts={data.attempts}
      months={months}
      onOpen={(attempt) => {
        setAttemptsOpen(false);
        navigate(ROUTES.student.testResults(attempt.quizId));
      }}
    />
  );

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink">
        <MobilePageHeader
          title={t("workspace.tests.title")}
          backLabel={t("workspace.back")}
          onBack={() => navigate(ROUTES.student.workspace)}
          action={
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
              aria-label={t("workspace.tests.attempts")}
              onClick={() => setAttemptsOpen(true)}
            >
              <Icon name="history" size={22} />
            </button>
          }
        />
        <FilterChips compact items={chips} value={filter} onChange={setFilter} />
        {cards}
        {dialog}
      </main>
    );

  return (
    <WorkspaceShell
      eyebrow={t("workspace.tests.eyebrow", { count: data.quizzes.length })}
      title={t("workspace.tests.title")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <FilterChips items={chips} value={filter} onChange={setFilter} />
        <button type="button" className={`${workspaceGhostAction} h-[42px]`} onClick={() => setAttemptsOpen(true)}>
          {t("workspace.tests.attempts")}
        </button>
      </div>
      {cards}
      {dialog}
    </WorkspaceShell>
  );
}

function TestCard({
  quiz,
  attempt,
  overdue,
  onSolve,
  onResult,
}: {
  quiz: QuizSummary;
  attempt: StudentAttemptSummary | null;
  overdue: boolean;
  onSolve: () => void;
  onResult: () => void;
}) {
  const { t } = useTranslation("student");
  const percent = attempt ? Math.round(attempt.percentage ?? 0) : null;
  return (
    <article className="flex flex-col gap-3.5 rounded-2xl bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-violet-bg text-accent-violet-fg">
          <Icon name="quiz" size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title text-ink">{quizDisplayTitle(quiz)}</strong>
          <small className="truncate text-body-sm text-ink-secondary">
            {t("workspace.tests.meta", {
              subject: quiz.subjectLabel || t("workspace.tests.otherSubject"),
              count: quiz.questionCount,
            })}
          </small>
        </span>
        {percent !== null ? (
          <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 text-caption-strong text-success-fg">
            <Icon name="check-circle" size={14} />
            {t("workspace.tests.solvedChip", { value: percent })}
          </span>
        ) : overdue ? (
          <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-danger-bg px-2 text-caption-strong text-error-text">
            <Icon name="clock" size={14} />
            {t("workspace.tests.overdueChip")}
          </span>
        ) : null}
      </div>
      {attempt ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-button text-ink transition-colors hover:bg-subtle"
            onClick={onResult}
          >
            <Icon name="bar-chart" size={18} />
            {t("workspace.tests.result")}
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand transition-colors hover:bg-tint"
            onClick={onSolve}
          >
            <Icon name="refresh" size={18} />
            {t("workspace.tests.retry")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
          onClick={onSolve}
        >
          <Icon name="send" size={18} />
          {t("workspace.tests.solve")}
        </button>
      )}
    </article>
  );
}

function AttemptsDialog({
  open,
  onOpenChange,
  attempts,
  months,
  onOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempts: StudentAttemptSummary[];
  months: string[];
  onOpen: (attempt: StudentAttemptSummary) => void;
}) {
  const { t } = useTranslation("student");
  const rows = [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="sheet"
      title={t("workspace.tests.attemptsTitle")}
      description={t("workspace.tests.attemptsSubtitle")}
      width="lg:w-[480px]"
    >
      {rows.length ? (
        <div className="-mx-1 flex flex-col">
          {rows.map((attempt) => (
            <button
              key={`${attempt.quizId}-${attempt.takenAt}`}
              type="button"
              className="flex items-center gap-3 rounded-xl px-1 py-3 text-left transition-colors hover:bg-subtle"
              onClick={() => onOpen(attempt)}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-violet-bg text-accent-violet-fg">
                <Icon name="quiz" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title text-ink">{attempt.quizTitle}</strong>
                <small className="truncate text-body-sm text-ink-secondary">
                  {[attempt.courseTitle, shortDateTime(attempt.takenAt, months)].filter(Boolean).join(" · ")}
                </small>
              </span>
              <strong className="shrink-0 text-title text-ink">{Math.round(attempt.percentage ?? 0)}%</strong>
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
            </button>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-body-sm text-ink-secondary">{t("workspace.tests.attemptsEmpty")}</p>
      )}
    </AppDialog>
  );
}

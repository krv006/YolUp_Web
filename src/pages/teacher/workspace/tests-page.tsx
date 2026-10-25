import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AssignQuizDialog,
  QuizAttemptsDrawer,
  QuizImportDialog,
  quizDisplayTitle,
  useAssignQuizToCourse,
  useCreateQuiz,
  usePublishQuiz,
  useQuizAttempts,
  useQuizzes,
  useUpdateQuiz,
} from "@/modules/quiz";
import { NewTestDialog, type NewTestDraft } from "./new-test-dialog";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import type { QuizSummary } from "@/shared/types";
import { WorkspaceShell, workspaceAction, workspaceGhostAction } from "@/widgets/workspace-shell";

const DRAFT = "draft";

export function TestsPage() {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  const quizzes = useQuizzes(null);
  const courses = useCourses();
  const subjectOptions = useSubjects();
  const publish = usePublishQuiz();
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const assign = useAssignQuizToCourse();
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<QuizSummary | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const attempts = useQuizAttempts(attemptsOf?.id ?? null, Boolean(attemptsOf));

  const courseOptions = (courses.data ?? []).map((course) => ({
    id: course.id,
    label: course.title,
    subject: course.subject,
  }));

  function startTest(draft: NewTestDraft) {
    create.mutate(
      {
        courseId: draft.courseId,
        subject: draft.subject || undefined,
        status: "draft",
        lessonId: null,
        title: draft.title,
        topic: draft.title,
        description: "",
        dueAt: draft.dueAt,
        opensAt: null,
        groups: [],
        questions: [],
      },
      {
        onSuccess: (quiz) => {
          setCreateOpen(false);
          navigate(ROUTES.teacher.test(quiz.id));
        },
      }
    );
  }

  const items = useMemo(() => quizzes.data ?? [], [quizzes.data]);

  const subjects = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const quiz of items) {
      const key = quiz.subject || quiz.subjectLabel || "other";
      const entry = map.get(key);
      if (entry) entry.count += 1;
      else map.set(key, { label: quiz.subjectLabel || key, count: 1 });
    }
    return [...map.entries()].map(([id, value]) => ({ id, ...value }));
  }, [items]);

  const draftCount = items.filter((quiz) => quiz.status === DRAFT).length;

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === DRAFT) return items.filter((quiz) => quiz.status === DRAFT);
    return items.filter((quiz) => (quiz.subject || quiz.subjectLabel) === filter);
  }, [items, filter]);

  const sections = useMemo(() => {
    const map = new Map<string, QuizSummary[]>();
    for (const quiz of visible) {
      const key = quiz.subjectLabel || t("tests.otherSubject");
      const bucket = map.get(key);
      if (bucket) bucket.push(quiz);
      else map.set(key, [quiz]);
    }
    return [...map.entries()];
  }, [visible, t]);

  const chips = [
    { id: "all", label: t("tests.filters.all"), count: items.length },
    ...subjects.map((subject) => ({ id: subject.id, label: subject.label, count: subject.count })),
    ...(draftCount ? [{ id: DRAFT, label: t("tests.filters.draft"), count: draftCount }] : []),
  ];

  return (
    <WorkspaceShell
      eyebrow={t("tests.eyebrow", { count: items.length })}
      title={t("tests.title")}
      action={
        <button type="button" className={workspaceAction} onClick={() => setCreateOpen(true)}>
          {t("tests.create")}
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {chips.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-label transition-colors ${
                  active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary hover:text-ink"
                }`}
                onClick={() => setFilter(chip.id)}
              >
                {chip.label} · {chip.count}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={workspaceGhostAction}
          disabled={!items.length}
          onClick={() => setAttemptsOf(items.find((quiz) => quiz.status !== DRAFT) ?? items[0])}
        >
          {t("tests.attempts")}
        </button>
        <button type="button" className={workspaceGhostAction} onClick={() => setImportOpen(true)}>
          {t("tests.import")}
        </button>
      </div>

      {quizzes.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-31 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : null}

      {sections.map(([label, rows]) => (
        <section key={label} className="flex flex-col gap-3">
          <span className="text-overline text-ink-tertiary uppercase">{label}</span>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((quiz) => {
              const draft = quiz.status === DRAFT;
              return (
                <article key={quiz.id} className="flex flex-col gap-3.5 rounded-lg bg-surface p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-violet-bg text-accent-violet-fg">
                      <Icon name="quiz" size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <strong className="truncate text-title-lg text-ink">
                        {quizDisplayTitle(quiz)}
                      </strong>
                      <small className="truncate text-body-xs text-ink-tertiary">
                        {quiz.subjectLabel} · {t("tests.questionCount", { count: quiz.questionCount })}
                      </small>
                    </span>
                    {draft ? (
                      <span className="flex h-6.5 shrink-0 items-center gap-1 rounded-full bg-accent-violet-bg px-2.5 text-caption-strong text-accent-violet-fg">
                        <Icon name="edit" size={13} />
                        {t("tests.draft")}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {draft ? (
                      <>
                        <button
                          type="button"
                          className="flex h-9.5 items-center justify-center gap-2 rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
                          onClick={() => navigate(ROUTES.teacher.test(quiz.id))}
                        >
                          <Icon name="edit" size={17} />
                          {t("tests.edit")}
                        </button>
                        <button
                          type="button"
                          className="flex h-9.5 items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand transition-colors hover:bg-tint disabled:opacity-50"
                          disabled={publish.isPending}
                          onClick={() => publish.mutate(quiz.id)}
                        >
                          <Icon name="send" size={17} />
                          {t("tests.publish")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex h-9.5 items-center justify-center gap-2 rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
                          onClick={() => navigate(ROUTES.teacher.testResults(quiz.id))}
                        >
                          <Icon name="bar-chart" size={17} />
                          {t("tests.results")}
                        </button>
                        <button
                          type="button"
                          className="flex h-9.5 items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand transition-colors hover:bg-tint"
                          onClick={() => setAssignTarget(quiz)}
                        >
                          <Icon name="send" size={17} />
                          {t("tests.assign")}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {!quizzes.isLoading && !items.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-7 text-center">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="quiz" size={32} />
          </span>
          <span className="flex flex-col gap-2">
            <strong className="font-heading text-h2 text-ink">{t("tests.emptyTitle")}</strong>
            <p className="max-w-70 text-body-sm text-ink-secondary">{t("tests.emptyHint")}</p>
          </span>
          <button type="button" className={workspaceAction} onClick={() => setCreateOpen(true)}>
            {t("tests.create")}
          </button>
        </div>
      ) : null}

      <NewTestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        courses={courseOptions}
        subjects={(subjectOptions.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
        pending={create.isPending}
        onContinue={startTest}
        onImport={() => {
          setCreateOpen(false);
          setImportOpen(true);
        }}
      />

      <QuizImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        request={{ topic: t("tests.importedTopic") }}
        onImported={(quiz) => navigate(ROUTES.teacher.test(quiz.id))}
      />

      <AssignQuizDialog
        open={Boolean(assignTarget)}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        quizId={assignTarget?.id ?? null}
        quizLabel={assignTarget ? quizDisplayTitle(assignTarget) : ""}
        courses={courseOptions.map((course) => ({ id: course.id, label: course.label }))}
        pending={assign.isPending}
        onSubmit={({ quizId, courseId, dueAt }) => {
          const target = assignTarget;
          assign.mutateAsync({ quizId, courseId }).then(() => {
            if (dueAt && target) {
              update.mutate({
                id: target.id,
                values: {
                  title: target.title,
                  topic: target.topic,
                  dueAt,
                  opensAt: target.opensAt,
                  groups: [],
                },
              });
            }
            setAssignTarget(null);
          });
        }}
      />

      <QuizAttemptsDrawer
        open={Boolean(attemptsOf)}
        onOpenChange={(open) => {
          if (!open) setAttemptsOf(null);
        }}
        title={attemptsOf ? quizDisplayTitle(attemptsOf) : ""}
        subtitle={t("attemptsDrawer.unlimited")}
        attempts={attempts.data ?? []}
        loading={attempts.isLoading}
      />
    </WorkspaceShell>
  );
}

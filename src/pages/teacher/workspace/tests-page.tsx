import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AssignQuizDialog,
  QuizAttemptsDrawer,
  QuizExportDialog,
  QuizImportDialog,
  quizDisplayTitle,
  useAssignQuizToCourse,
  useCreateQuiz,
  useDeleteQuiz,
  useExportQuiz,
  usePublishQuiz,
  useQuizAttempts,
  useQuizzes,
  useUpdateQuiz,
} from "@/modules/quiz";
import { NewTestDialog, type NewTestDraft } from "./new-test-dialog";
import { MobileTests } from "./mobile-tests";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import type { QuizSummary } from "@/shared/types";
import { WorkspaceShell, workspaceAction, workspaceGhostAction } from "@/widgets/workspace-shell";

const DRAFT = "draft";

export function TestsPage() {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const [params, setParams] = useSearchParams();
  const quizzes = useQuizzes(null);
  const courses = useCourses();
  const subjectOptions = useSubjects();
  const publish = usePublishQuiz();
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const assign = useAssignQuizToCourse();
  const remove = useDeleteQuiz();
  const exportQuiz = useExportQuiz();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(() => params.get("new") === "1");
  const [exportOf, setExportOf] = useState<QuizSummary | null>(null);
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<QuizSummary | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const attempts = useQuizAttempts(attemptsOf?.id ?? null, Boolean(attemptsOf));

  const courseOptions = (courses.data ?? []).map((course) => ({
    id: course.id,
    label: course.title,
    subject: course.subject,
    studentCount: course.studentCount ?? 0,
  }));

  function changeCreateOpen(open: boolean) {
    setCreateOpen(open);
    if (!open && params.has("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }

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
          changeCreateOpen(false);
          navigate(isCompact ? `${ROUTES.teacher.test(quiz.id)}?step=2` : ROUTES.teacher.test(quiz.id));
        },
      }
    );
  }

  const items = useMemo(() => quizzes.data ?? [], [quizzes.data]);

  const subjects = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const course of courses.data ?? []) {
      const key = course.subject || course.subjectLabel;
      if (key && !map.has(key)) map.set(key, { label: course.subjectLabel || key, count: 0 });
    }
    for (const quiz of items) {
      const key = quiz.subject || quiz.subjectLabel || "other";
      const entry = map.get(key);
      if (entry) entry.count += 1;
      else map.set(key, { label: quiz.subjectLabel || key, count: 1 });
    }
    return [...map.entries()].map(([id, value]) => ({ id, ...value }));
  }, [items, courses.data]);

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
    ...subjects
      .filter((subject) => subject.count > 0)
      .map((subject) => ({ id: subject.id, label: subject.label, count: subject.count })),
    ...(draftCount ? [{ id: DRAFT, label: t("tests.filters.draft"), count: draftCount }] : []),
  ];

  const dialogs = (
    <>
      <NewTestDialog
        open={createOpen}
        onOpenChange={changeCreateOpen}
        courses={courseOptions}
        subjects={(subjectOptions.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
        pending={create.isPending}
        onContinue={startTest}
        onImport={() => setImportOpen(true)}
      />

      <QuizImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        request={{ topic: t("tests.importedTopic") }}
        onImported={(quiz) => {
          changeCreateOpen(false);
          navigate(ROUTES.teacher.test(quiz.id));
        }}
      />

      <AssignQuizDialog
        open={Boolean(assignTarget)}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        quizId={assignTarget?.id ?? null}
        quizLabel={assignTarget ? quizDisplayTitle(assignTarget) : ""}
        quizzes={items.filter((quiz) => quiz.status !== DRAFT).map((quiz) => ({ id: quiz.id, label: quizDisplayTitle(quiz) }))}
        courses={courseOptions.map((course) => ({ id: course.id, label: course.label, studentCount: course.studentCount }))}
        pending={assign.isPending}
        onSubmit={({ quizId, courseId, dueAt }) => {
          const target = items.find((quiz) => quiz.id === quizId) ?? assignTarget;
          assign.mutateAsync({ quizId, courseId }).then(() => {
            if (dueAt && target) {
              update.mutate({
                id: target.id,
                values: { dueAt },
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

      <QuizExportDialog
        open={Boolean(exportOf)}
        onOpenChange={(open) => {
          if (!open) setExportOf(null);
        }}
        title={exportOf ? quizDisplayTitle(exportOf) : ""}
        pending={exportQuiz.isPending ? "pending" : null}
        onExport={(type, mode) => {
          if (!exportOf) return;
          exportQuiz
            .mutateAsync({ id: exportOf.id, type, mode, name: quizDisplayTitle(exportOf) })
            .then(() => setExportOf(null));
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        icon="trash"
        title={t("tests.mobile.deleteTitle")}
        description={t("tests.mobile.deleteDescription", { title: deleting ? quizDisplayTitle(deleting) : "" })}
        confirmLabel={t("tests.mobile.delete")}
        cancelLabel={t("tests.mobile.cancel")}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutateAsync(deleting.id).then(() => setDeleting(null))}
      />
    </>
  );

  if (isCompact) {
    const needle = query.trim().toLocaleLowerCase();
    const matches = items.filter(
      (quiz) =>
        (filter === "all" || (quiz.subject || quiz.subjectLabel) === filter) &&
        (!needle ||
          [quizDisplayTitle(quiz), quiz.topic, quiz.subjectLabel].some((value) =>
            (value ?? "").toLocaleLowerCase().includes(needle)
          ))
    );
    return (
      <>
        <MobileTests
          drafts={matches.filter((quiz) => quiz.status === DRAFT)}
          published={matches.filter((quiz) => quiz.status !== DRAFT)}
          loading={quizzes.isLoading}
          chips={[
            { id: "all", label: t("tests.filters.all") },
            ...subjects.map((subject) => ({ id: subject.id, label: subject.label })),
          ]}
          filter={filter === DRAFT ? "all" : filter}
          query={query}
          publishPending={publish.isPending}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onBack={() => navigate(ROUTES.teacher.workspace)}
          onCreate={() => changeCreateOpen(true)}
          onEdit={(quiz) =>
            navigate(quiz.status === DRAFT ? ROUTES.teacher.test(quiz.id) : ROUTES.teacher.testEdit(quiz.id))
          }
          onPublish={(quiz) => publish.mutate(quiz.id)}
          onResults={(quiz) => navigate(ROUTES.teacher.testResults(quiz.id))}
          onAssign={setAssignTarget}
          onAttempts={setAttemptsOf}
          onDownload={setExportOf}
          onDelete={setDeleting}
        />
        {dialogs}
      </>
    );
  }

  return (
    <WorkspaceShell
      eyebrow={quizzes.isLoading ? t("tests.eyebrowLoading") : t("tests.eyebrow", { count: items.length })}
      title={t("tests.title")}
      action={
        <button type="button" className={workspaceAction} onClick={() => changeCreateOpen(true)}>
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
                className={`flex h-[22px] shrink-0 items-center rounded-full px-2 text-caption-strong transition-colors ${
                  active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink hover:bg-muted"
                }`}
                onClick={() => setFilter(chip.id)}
              >
                {quizzes.isLoading ? chip.label : `${chip.label} · ${chip.count}`}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={workspaceGhostAction}
          disabled={!quizzes.isLoading && !items.length}
          onClick={() => items.length && setAttemptsOf(items.find((quiz) => quiz.status !== DRAFT) ?? items[0])}
        >
          {t("tests.attempts")}
        </button>
        <button type="button" className={workspaceGhostAction} onClick={() => setImportOpen(true)}>
          {t("tests.import")}
        </button>
      </div>

      {quizzes.isLoading ? (
        <div className="flex flex-col gap-[18px]" aria-hidden="true">
          {[6, 2].map((count, section) => (
            <Fragment key={section}>
              <i className="h-3 w-30 rounded-full bg-skeleton" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: count }, (_, index) => (
                  <span key={index} className="flex h-33 flex-col gap-3 rounded-2xl bg-surface p-4">
                    <span className="flex gap-3">
                      <i className="size-9 shrink-0 rounded-sm bg-skeleton" />
                      <span className="flex min-w-0 flex-1 flex-col gap-2">
                        <i className="h-3 w-[183px] max-w-full rounded-full bg-skeleton" />
                        <i className="h-2.5 w-[109px] max-w-full rounded-full bg-skeleton" />
                      </span>
                    </span>
                    <span className="grid grid-cols-2 gap-2">
                      <i className="h-9 rounded-sm bg-skeleton" />
                      <i className="h-9 rounded-sm bg-skeleton" />
                    </span>
                  </span>
                ))}
              </div>
            </Fragment>
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
          <button type="button" className={workspaceAction} onClick={() => changeCreateOpen(true)}>
            {t("tests.create")}
          </button>
        </div>
      ) : null}

      {dialogs}
    </WorkspaceShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { FileQuestion, History, ListFilter, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AddQuizDialog,
  QuizAttemptsDialog,
  useQuiz,
  useQuizAttempts,
  quizErrorMessage,
  usePublishQuiz,
  useUpdateQuiz,
  useCreateQuiz,
  useDeleteQuiz,
  useQuizzes,
  quizDisplayTitle,
} from "@/modules/quiz";
import type { QuizImportWarning, QuizSummary } from "@/shared/types";
import { Button, Dialog, DialogContent, LoadingFallback, PageBackLink, RouteState } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";

function useQuizHighlight(quizId: string | null, ready: boolean) {
  useEffect(() => {
    if (!quizId || !ready) return;
    document
      .querySelector(`[data-quiz-id="${CSS.escape(quizId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [quizId, ready]);
}

export function TeacherQuizzesPage() {
  const { t, i18n } = useTranslation("quiz");
  const courses = useCourses();
  const subjects = useSubjects();
  const quizzes = useQuizzes(null);
  const create = useCreateQuiz();
  const remove = useDeleteQuiz();
  const [dialog, setDialog] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const [editTarget, setEditTarget] = useState<QuizSummary | null>(null);
  const editDetail = useQuiz(editTarget?.id ?? null);
  const editAttempts = useQuizAttempts(editTarget?.id ?? null, Boolean(editTarget));
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();
  const [importedWarnings, setImportedWarnings] = useState<QuizImportWarning[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const [params] = useSearchParams();
  const highlightId = params.get("quiz");
  useQuizHighlight(highlightId, (quizzes.data?.length ?? 0) > 0);

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );
  const subjectOptions = subjects.data ?? [];
  const canCreate = subjectOptions.length > 0;

  function closeEditor() {
    setEditTarget(null);
    setImportedWarnings([]);
    setPublishError(null);
  }

  if (quizzes.isLoading) return <LoadingFallback label={t("teacherPage.loading")} />;
  if (quizzes.isError)
    return (
      <RouteState
        eyebrow={t("teacherPage.eyebrow")}
        title={t("teacherPage.loadError")}
        description={quizzes.error?.message}
        actionLabel={t("teacherPage.retry")}
        onAction={quizzes.refetch}
      />
    );

  const all = quizzes.data ?? [];
  const list = subjectFilter ? all.filter((item) => item.subject === subjectFilter) : all;
  const filterOptions = [
    { value: "", label: t("teacherPage.allSubjects") },
    ...subjectOptions
      .filter((item) => all.some((quiz) => quiz.subject === item.value))
      .map((item) => ({ value: item.value, label: item.label })),
  ];

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("teacherPage.allCourses")}</span>
          <h1>{t("teacherPage.title")}</h1>
          <p>{t("teacherPage.subtitle")}</p>
        </div>
        <div className="heading-actions quiz-heading-actions">
          {filterOptions.length > 1 ? (
            <div className="quiz-subject-filter">
              <SelectPicker
                label={t("teacherPage.subjectFilterLabel")}
                hideLabel
                searchable
                icon={ListFilter}
                value={subjectFilter}
                onChange={setSubjectFilter}
                options={filterOptions}
              />
            </div>
          ) : null}
          <Button onClick={() => setDialog(true)} disabled={!canCreate}>
            <Plus size={17} /> {t("teacherPage.createButton")}
          </Button>
        </div>
      </div>

      {list.length ? (
        <div className="assignment-list">
          {list.map((item) => (
            <motion.article
              key={item.id}
              data-quiz-id={item.id}
              className={`assignment-card ${item.id === highlightId ? "is-highlighted" : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="assignment-card-icon">
                <FileQuestion size={20} />
              </span>
              <div>
                <strong>
                  {quizDisplayTitle(item)}
                  {item.status === "draft" ? (
                    <span className="quiz-draft-badge">{t("teacherPage.draftBadge")}</span>
                  ) : null}
                </strong>
                <p>{item.description}</p>
                <small>
                  {courseTitleById.get(item.courseId) || item.subjectLabel || t("teacherPage.courseFallback")} ·{" "}
                  {item.dueAt
                    ? t("teacherPage.dueLabel", {
                        date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.dueAt)),
                      })
                    : t("teacherPage.noDue")}{" "}
                  · {t("teacherPage.questionCount", { count: item.questionCount })}
                </small>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setAttemptsOf(item)}>
                <History size={15} /> {t("teacherPage.attemptsButton")}
              </Button>
              <button
                className="icon-button"
                aria-label={t("editDialog.editAria")}
                title={t("editDialog.editAria")}
                onClick={() => setEditTarget(item)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button destructive-icon"
                onClick={() => setDeleteTarget(item)}
                aria-label={t("teacherPage.deleteAria")}
              >
                <Trash2 size={16} />
              </button>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="premium-empty">
          <FileQuestion size={30} />
          <h3>{subjectFilter ? t("teacherPage.emptyForSubject") : t("teacherPage.emptyTitle")}</h3>
          {subjectFilter ? (
            <Button variant="secondary" onClick={() => setSubjectFilter("")}>
              {t("teacherPage.clearFilter")}
            </Button>
          ) : canCreate ? (
            <Button onClick={() => setDialog(true)}>{t("teacherPage.emptyCreateFirst")}</Button>
          ) : null}
        </div>
      )}

      {editTarget && editDetail.data && !editAttempts.isLoading ? (
        <AddQuizDialog
          key={editTarget.id}
          open
          onOpenChange={(next) => {
            if (!next) closeEditor();
          }}
          courses={[]}
          editQuiz={editDetail.data}
          initialWarnings={importedWarnings}
          startOnQuestions={importedWarnings.length > 0}
          questionsLocked={(editAttempts.data ?? []).length > 0}
          saving={update.isPending}
          publishing={publish.isPending}
          publishError={publishError}
          showSchedule
          onCreate={() => undefined}
          onUpdate={(values) =>
            update.mutateAsync({ id: editTarget.id, values }).then(() => closeEditor())
          }
          onPublish={() => {
            setPublishError(null);
            publish
              .mutateAsync(editTarget.id)
              .then(() => closeEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)));
          }}
        />
      ) : null}

      <AddQuizDialog
        open={dialog}
        onImported={(result) => {
          setImportedWarnings(result.warnings);
          setPublishError(null);
          setEditTarget({ ...result.quiz });
        }}
        onOpenChange={setDialog}
        courses={[]}
        subjects={subjectOptions}
        onCreate={(form) => {
          create.mutateAsync(form).then(() => setDialog(false));
        }}
      />
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        {deleteTarget && (
          <DialogContent
            title={t("teacherPage.deleteDialogTitle")}
            description={t("teacherPage.deleteDialogDescription", { title: deleteTarget.title })}
          >
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                {t("teacherPage.cancel")}
              </Button>
              <Button
                loading={remove.isPending}
                onClick={() => remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))}
              >
                {t("teacherPage.delete")}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <QuizAttemptsDialog
        quizId={attemptsOf?.id ?? null}
        open={Boolean(attemptsOf)}
        onOpenChange={(open) => {
          if (!open) setAttemptsOf(null);
        }}
        title={attemptsOf ? t("teacherPage.attemptsOfTitle", { title: attemptsOf.title }) : undefined}
      />
    </div>
  );
}

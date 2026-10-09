import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, FileQuestion, History, ListFilter, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AddQuizDialog,
  AssignQuizDialog,
  QuizAttemptsDialog,
  useAssignQuizToCourse,
  useQuiz,
  useQuizAttempts,
  quizErrorMessage,
  usePublishQuiz,
  useRemoveGroupAudio,
  useUploadGroupAudio,
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const [editTarget, setEditTarget] = useState<QuizSummary | null>(null);
  const [openOnQuestions, setOpenOnQuestions] = useState(false);
  const editDetail = useQuiz(editTarget?.id ?? null);
  const editAttempts = useQuizAttempts(editTarget?.id ?? null, Boolean(editTarget));
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();
  const uploadAudio = useUploadGroupAudio(editTarget?.id ?? "");
  const removeAudio = useRemoveGroupAudio(editTarget?.id ?? "");
  const [importedWarnings, setImportedWarnings] = useState<QuizImportWarning[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const [giveTarget, setGiveTarget] = useState<QuizSummary | null>(null);
  const assign = useAssignQuizToCourse();
  const [params] = useSearchParams();
  const highlightId = params.get("quiz");
  useQuizHighlight(highlightId, (quizzes.data?.length ?? 0) > 0);

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );
  const subjectOptions = subjects.data ?? [];
  const canCreate = subjectOptions.length > 0;

  /** Kartochka bosilganda savollar to'g'ridan-to'g'ri ochiladi (qalamcha esa avval mavzu/nom oynasini ochadi). */
  function openQuestions(item: QuizSummary) {
    setOpenOnQuestions(true);
    setEditTarget(item);
  }

  function closeEditor() {
    setEditTarget(null);
    setOpenOnQuestions(false);
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

  const groupMap = new Map<string, { key: string; label: string; items: QuizSummary[] }>();
  for (const item of list) {
    const key = item.subject || "other";
    const label = item.subjectLabel || item.subject || t("teacherPage.courseFallback");
    const group = groupMap.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    groupMap.set(key, group);
  }
  const groups = [...groupMap.values()].sort((a, b) => a.label.localeCompare(b.label, i18n.language));

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

      {groups.length ? (
        <div className="quiz-subject-groups">
          {groups.map((group, index) => {
            const isOpen =
              expanded[group.key] ?? (index === 0 || group.items.some((item) => item.id === highlightId));
            const drafts = group.items.filter((item) => item.status === "draft").length;
            return (
              <section key={group.key} className={`quiz-subject-group ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="quiz-subject-head"
                  aria-expanded={isOpen}
                  aria-label={t("teacherPage.sectionToggleAria", { subject: group.label })}
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
                >
                  <span className="quiz-subject-icon">
                    <BookOpen size={22} />
                  </span>
                  <span className="quiz-subject-title">
                    <strong>{group.label}</strong>
                    <small>
                      {t("teacherPage.sectionCount", { count: group.items.length })}
                      {drafts ? (
                        <span className="quiz-subject-drafts">
                          {" "}
                          · {t("teacherPage.sectionDrafts", { count: drafts })}
                        </span>
                      ) : null}
                    </small>
                  </span>
                  <ChevronDown size={22} className="quiz-subject-chevron" />
                </button>
                {isOpen ? (
                  <div className="assignment-list quiz-subject-body">
                    {group.items.map((item) => (
                      <motion.article
                        key={item.id}
                        data-quiz-id={item.id}
                        className={`assignment-card is-clickable ${item.id === highlightId ? "is-highlighted" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-label={t("teacherPage.openQuestionsAria", { title: quizDisplayTitle(item) })}
                        onClick={(event) => {
                          if ((event.target as HTMLElement).closest("button")) return;
                          openQuestions(item);
                        }}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openQuestions(item);
                          }
                        }}
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
                        {item.courseId ? null : (
                          <Button size="sm" variant="secondary" onClick={() => setGiveTarget(item)}>
                            <Send size={15} /> {t("teacherPage.giveToGroup")}
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setAttemptsOf(item)}>
                          <History size={15} /> {t("teacherPage.attemptsButton")}
                        </Button>
                        <button
                          className="icon-button"
                          aria-label={t("editDialog.editAria")}
                          title={t("editDialog.editAria")}
                          onClick={() => {
                            setOpenOnQuestions(false);
                            setEditTarget(item);
                          }}
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
                ) : null}
              </section>
            );
          })}
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
          uploadingAudio={uploadAudio.isPending}
          onUploadAudio={(groupId, file) => uploadAudio.mutate({ groupId, file })}
          onRemoveAudio={(groupId) => removeAudio.mutate(groupId)}
          startOnQuestions={importedWarnings.length > 0 || openOnQuestions}
          questionsLocked={(editAttempts.data ?? []).length > 0}
          saving={update.isPending}
          publishing={publish.isPending}
          publishError={publishError}
          showSchedule
          onCreate={() => undefined}
          onUpdate={(values) =>
            update.mutateAsync({ id: editTarget.id, values }).then(() => closeEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)))
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
      <AssignQuizDialog
        open={Boolean(giveTarget)}
        onOpenChange={(open) => {
          if (!open) setGiveTarget(null);
        }}
        quizId={giveTarget?.id ?? null}
        courses={(courses.data ?? [])
          .slice()
          .sort((a, b) => Number(b.subject === giveTarget?.subject) - Number(a.subject === giveTarget?.subject))
          .map((course) => ({ id: course.id, label: course.title }))}
        pending={assign.isPending}
        onSubmit={(value) => assign.mutateAsync(value).then(() => setGiveTarget(null))}
      />
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

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Download, FileQuestion, History, ListFilter, Pencil, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AddQuizDialog,
  AssignQuizDialog,
  QuizAttemptsDialog,
  QuizExportDialog,
  useAssignQuizToCourse,
  useExportQuiz,
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
import { Button, Dialog, DialogContent, LoadingFallback, RouteState } from "@/shared/ui/legacy";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { usePageCreateStore } from "@/shared/model";
import { SubjectFilterSheet } from "@/modules/quiz";

function useQuizHighlight(quizId: string | null, ready: boolean) {
  useEffect(() => {
    if (!quizId || !ready) return;
    document
      .querySelector(`[data-quiz-id="${CSS.escape(quizId)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [quizId, ready]);
}

const QUIZ_ACTION =
  "flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-label-strong transition-colors";

export function TeacherQuizzesPage() {
  const { t, i18n } = useTranslation("quiz");
  const courses = useCourses();
  const subjects = useSubjects();
  const quizzes = useQuizzes(null);
  const create = useCreateQuiz();
  const remove = useDeleteQuiz();
  const dialog = usePageCreateStore((state) => state.open.quiz);
  const setDialog = (value: boolean) => usePageCreateStore.getState().setOpen("quiz", value);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [subjectSheet, setSubjectSheet] = useState(false);
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
  const [exportTarget, setExportTarget] = useState<QuizSummary | null>(null);
  const exporter = useExportQuiz();
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
    <div className="relative flex h-full flex-col gap-4 overflow-y-auto bg-canvas p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-body-sm text-ink-secondary">{t("teacherPage.subtitle")}</p>
        {filterOptions.length > 1 ? (
          <>
            <button
              type="button"
              className="flex h-12 w-full shrink-0 items-center gap-3 rounded-2xl bg-subtle px-4 text-left text-title text-ink lg:hidden"
              onClick={() => setSubjectSheet(true)}
            >
              <ListFilter size={18} className="shrink-0 text-ink-secondary" />
              <span className="min-w-0 flex-1 truncate">
                {filterOptions.find((item) => item.value === subjectFilter)?.label ??
                  filterOptions[0]?.label}
              </span>
              <ChevronDown size={18} className="shrink-0 text-ink-secondary" />
            </button>

            <div className="hidden w-full shrink-0 sm:w-[240px] lg:block">
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
          </>
        ) : null}
      </div>

      {groups.length ? (
        <div className="flex flex-col gap-3">
          {groups.map((group, index) => {
            const isOpen =
              expanded[group.key] ?? (index === 0 || group.items.some((item) => item.id === highlightId));
            const drafts = group.items.filter((item) => item.status === "draft").length;
            return (
              <section
                key={group.key}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
              >
                <button
                  type="button"
                  className="flex items-center gap-3 text-left"
                  aria-expanded={isOpen}
                  aria-label={t("teacherPage.sectionToggleAria", { subject: group.label })}
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                    <BookOpen size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{group.label}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {t("teacherPage.sectionCount", { count: group.items.length })}
                      {drafts ? (
                        <span className="text-saffron-strong">
                          {" · "}
                          {t("teacherPage.sectionDrafts", { count: drafts })}
                        </span>
                      ) : null}
                    </small>
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-ink-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen ? (
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <motion.article
                        key={item.id}
                        data-quiz-id={item.id}
                        className={`flex flex-col gap-3 rounded-2xl p-4 transition-colors ${
                          item.id === highlightId ? "bg-action-subtle" : "bg-subtle"
                        }`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          type="button"
                          className="flex items-start gap-3 text-left"
                          aria-label={t("teacherPage.openQuestionsAria", {
                            title: quizDisplayTitle(item),
                          })}
                          onClick={() => openQuestions(item)}
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                            <FileQuestion size={18} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <strong className="flex flex-wrap items-center gap-2 text-label-strong text-ink">
                              {quizDisplayTitle(item)}
                              {item.status === "draft" ? (
                                <span className="rounded-full bg-saffron-subtle px-2.5 py-0.5 text-caption-strong text-saffron-strong">
                                  {t("teacherPage.draftBadge")}
                                </span>
                              ) : null}
                            </strong>
                            {item.description ? (
                              <p className="line-clamp-2 text-body-sm text-ink-secondary">
                                {item.description}
                              </p>
                            ) : null}
                            <small className="truncate text-caption text-ink-tertiary">
                              {courseTitleById.get(item.courseId) ||
                                item.subjectLabel ||
                                t("teacherPage.courseFallback")}{" "}
                              ·{" "}
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
                          </span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {item.courseId ? null : (
                            <button
                              type="button"
                              className={`${QUIZ_ACTION} bg-action-subtle text-action`}
                              onClick={() => setGiveTarget(item)}
                            >
                              <Send size={16} /> {t("teacherPage.giveToGroup")}
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${QUIZ_ACTION} border border-line bg-surface text-ink hover:bg-subtle`}
                            onClick={() => setAttemptsOf(item)}
                          >
                            <History size={16} /> {t("teacherPage.attemptsButton")}
                          </button>
                          <button
                            type="button"
                            className={`${QUIZ_ACTION} border border-line bg-surface text-ink hover:bg-subtle`}
                            onClick={() => setExportTarget(item)}
                          >
                            <Download size={16} /> {t("teacherPage.exportShort")}
                          </button>
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`${QUIZ_ACTION} flex-1 border border-line bg-surface text-ink hover:bg-subtle`}
                              onClick={() => {
                                setOpenOnQuestions(false);
                                setEditTarget(item);
                              }}
                            >
                              <Pencil size={16} /> {t("teacherPage.editShort")}
                            </button>
                            <button
                              type="button"
                              className="grid size-11 shrink-0 place-items-center rounded-xl bg-error-bg text-error-text transition-opacity hover:opacity-80"
                              onClick={() => setDeleteTarget(item)}
                              aria-label={t("teacherPage.deleteAria")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </span>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-action text-on-action">
            <FileQuestion size={28} />
          </span>
          <strong className="font-heading text-h3 text-ink">
            {subjectFilter ? t("teacherPage.emptyForSubject") : t("teacherPage.emptyTitle")}
          </strong>
          {subjectFilter ? null : (
            <p className="max-w-[320px] text-body-sm text-ink-secondary">
              {t("teacherPage.emptyDescription")}
            </p>
          )}
          {subjectFilter ? (
            <button
              type="button"
              className="mt-1 flex h-12 items-center rounded-full border border-line bg-surface px-5 text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => setSubjectFilter("")}
            >
              {t("teacherPage.clearFilter")}
            </button>
          ) : canCreate ? (
            <button
              type="button"
              className="mt-1 hidden h-12 items-center rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover lg:flex"
              onClick={() => setDialog(true)}
            >
              {t("teacherPage.emptyCreateFirst")}
            </button>
          ) : null}
        </div>
      )}

      {canCreate ? (
        <div className="mt-2 lg:hidden">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-full bg-action text-title text-on-action transition-colors hover:bg-action-hover"
            onClick={() => setDialog(true)}
          >
            {t("teacherPage.createButton")}
          </button>
        </div>
      ) : null}

      <SubjectFilterSheet
        open={subjectSheet}
        onOpenChange={setSubjectSheet}
        value={subjectFilter}
        options={filterOptions}
        onChange={setSubjectFilter}
      />

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
      <QuizExportDialog
        open={Boolean(exportTarget)}
        onOpenChange={(open) => {
          if (!open) setExportTarget(null);
        }}
        title={exportTarget ? quizDisplayTitle(exportTarget) : ""}
        pending={exporter.isPending ? `${exporter.variables?.mode}:${exporter.variables?.type}` : null}
        onExport={(type, mode) =>
          exportTarget &&
          exporter.mutate({ id: exportTarget.id, type, mode, name: quizDisplayTitle(exportTarget) })
        }
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

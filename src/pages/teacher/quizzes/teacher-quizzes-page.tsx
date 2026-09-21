import { useEffect, useMemo, useState } from "react";
import { FileQuestion, History, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AddQuizDialog,
  QuizAttemptsDialog,
  useCreateQuiz,
  useDeleteQuiz,
  useQuizzes,
} from "@/modules/quiz";
import type { QuizSummary } from "@/shared/types";
import { Button, Dialog, DialogContent, LoadingFallback, PageBackLink, RouteState } from "@/shared/ui/legacy";

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
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
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

  const list = quizzes.data ?? [];

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("teacherPage.allCourses")}</span>
          <h1>{t("teacherPage.title")}</h1>
          <p>{t("teacherPage.subtitle")}</p>
        </div>
        <Button onClick={() => setDialog(true)} disabled={!canCreate}>
          <Plus size={17} /> {t("teacherPage.createButton")}
        </Button>
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
                <strong>{item.title}</strong>
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
          <h3>{t("teacherPage.emptyTitle")}</h3>
          {canCreate ? (
            <Button onClick={() => setDialog(true)}>{t("teacherPage.emptyCreateFirst")}</Button>
          ) : null}
        </div>
      )}

      <AddQuizDialog
        open={dialog}
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

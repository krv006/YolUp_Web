import { useState } from "react";
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toIntlLocale } from "@/shared/i18n";
import { useCourses } from "@/modules/course";
import { useQuizzes } from "@/modules/quiz";
import {
  ExamCreateDialog,
  ExamResultsView,
  ExamTemplateDialog,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExam,
  useExamTemplates,
  useExams,
  useUpdateExam,
} from "@/modules/exam";
import type { ExamSummary } from "@/shared/types";
import { Button, Dialog, DialogContent, LoadingFallback, PageBackLink, RouteState } from "@/shared/ui/legacy";
import { DatePicker } from "@/shared/ui/legacy/form-pickers";

export function TeacherExamsPage() {
  const { t, i18n } = useTranslation("exam");
  const courses = useCourses();
  const exams = useExams(null);
  const templates = useExamTemplates();
  const quizzes = useQuizzes(null);
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const update = useUpdateExam();
  const remove = useDeleteExam();
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [resultsOf, setResultsOf] = useState<ExamSummary | null>(null);
  const [editTarget, setEditTarget] = useState<ExamSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);
  const resultsExam = useExam(resultsOf?.id ?? null);

  if (exams.isLoading) return <LoadingFallback label={t("list.loading")} />;
  if (exams.isError)
    return (
      <RouteState
        eyebrow={t("list.eyebrow")}
        title={t("list.loadError")}
        description={exams.error?.message}
        actionLabel={t("list.retry")}
        onAction={exams.refetch}
      />
    );

  const list = exams.data ?? [];
  const courseOptions = (courses.data ?? []).map((course) => ({ id: course.id, title: course.title }));

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("list.eyebrow")}</span>
          <h1>{t("list.title")}</h1>
          <p>{t("teacherList.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!courseOptions.length}>
          <Plus size={17} /> {t("teacherList.createButton")}
        </Button>
      </div>

      {list.length ? (
        <div className="assignment-list">
          {list.map((exam) => (
            <motion.article
              key={exam.id}
              className="assignment-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="assignment-card-icon">
                <ClipboardCheck size={20} />
              </span>
              <div>
                <strong>
                  {exam.title}
                  <span className={`exam-state-badge is-${exam.state}`}>{t(`state.${exam.state}`)}</span>
                </strong>
                <small>
                  {exam.courseTitle ? `${exam.courseTitle} · ` : ""}
                  {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(exam.startsAt))}{" "}
                  · {t("list.minutes", { count: exam.totalMinutes })}
                </small>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setResultsOf(exam)}>
                {t("teacherList.results")}
              </Button>
              {exam.state === "upcoming" ? (
                <>
                  <button
                    className="icon-button"
                    aria-label={t("teacherList.editAria")}
                    onClick={() => setEditTarget(exam)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button destructive-icon"
                    aria-label={t("teacherList.deleteAria")}
                    onClick={() => setDeleteTarget(exam)}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : null}
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="premium-empty">
          <ClipboardCheck size={30} />
          <h3>{t("teacherList.empty")}</h3>
          {courseOptions.length ? (
            <Button onClick={() => setCreateOpen(true)}>{t("teacherList.createFirst")}</Button>
          ) : (
            <p className="portal-muted">{t("teacherList.needCourse")}</p>
          )}
        </div>
      )}

      <ExamCreateDialog
        open={createOpen}
        pending={create.isPending}
        courses={courseOptions}
        templates={templates.data ?? []}
        quizzes={quizzes.data ?? []}
        onOpenChange={setCreateOpen}
        onCreateTemplate={() => setTemplateOpen(true)}
        onCreate={(values) => create.mutateAsync(values).then(() => setCreateOpen(false))}
      />

      <ExamTemplateDialog
        open={templateOpen}
        pending={createTemplate.isPending}
        onOpenChange={setTemplateOpen}
        onCreate={(values) => createTemplate.mutateAsync(values).then(() => setTemplateOpen(false))}
      />

      <Dialog
        open={Boolean(resultsOf)}
        onOpenChange={(open) => {
          if (!open) setResultsOf(null);
        }}
      >
        {resultsOf && resultsExam.data ? (
          <DialogContent
            className="exam-results-dialog"
            title={t("teacherList.resultsTitle", { title: resultsOf.title })}
            description={t("teacherList.resultsDescription")}
          >
            <ExamResultsView exam={resultsExam.data} />
          </DialogContent>
        ) : null}
      </Dialog>

      <ExamEditDialog
        exam={editTarget}
        pending={update.isPending}
        onClose={() => setEditTarget(null)}
        onSave={(values) =>
          update.mutateAsync({ id: editTarget?.id as string, values }).then(() => setEditTarget(null))
        }
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        {deleteTarget ? (
          <DialogContent
            title={t("teacherList.deleteTitle")}
            description={t("teacherList.deleteDescription", { title: deleteTarget.title })}
          >
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                {t("teacherList.cancel")}
              </Button>
              <Button
                loading={remove.isPending}
                onClick={() => remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))}
              >
                {t("teacherList.delete")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function ExamEditDialog({
  exam,
  pending,
  onClose,
  onSave,
}: {
  exam: ExamSummary | null;
  pending: boolean;
  onClose: () => void;
  onSave: (values: { title: string; startsAt: string }) => void;
}) {
  const { t } = useTranslation("exam");
  const [title, setTitle] = useState(exam?.title ?? "");
  const [startsAt, setStartsAt] = useState(exam?.startsAt ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={Boolean(exam)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {exam ? (
        <DialogContent
          className="group-action-dialog"
          title={t("teacherList.editTitle")}
          description={t("teacherList.editDescription")}
        >
          <div className="group-action-form">
            <label className="field-group">
              <span>{t("createDialog.titleLabel")}</span>
              <div className="input-shell">
                <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
            </label>
            <DatePicker label={t("createDialog.startLabel")} value={startsAt} onChange={setStartsAt} includeTime />
            {error ? <div className="form-alert">{error}</div> : null}
            <div className="dialog-actions">
              <Button variant="secondary" onClick={onClose}>
                {t("teacherList.cancel")}
              </Button>
              <Button
                loading={pending}
                onClick={() => {
                  if (!title.trim()) {
                    setError(t("createDialog.validation.enterTitle"));
                    return;
                  }
                  if (!startsAt || new Date(startsAt).getTime() <= Date.now()) {
                    setError(t("createDialog.validation.startInFuture"));
                    return;
                  }
                  onSave({ title: title.trim(), startsAt });
                }}
              >
                {t("teacherList.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

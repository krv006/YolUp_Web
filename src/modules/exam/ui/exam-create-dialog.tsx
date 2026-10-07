import { useMemo, useState } from "react";
import { BookOpen, Coffee, LayoutList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { ExamTemplate, QuizSummary } from "@/shared/types";
import type { ExamFormValues } from "../api/exam.dto";

export interface ExamCreateDialogProps {
  open: boolean;
  pending?: boolean;
  courses: Array<{ id: string; title: string }>;
  templates: ExamTemplate[];
  quizzes: QuizSummary[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ExamFormValues) => void;
  onCreateTemplate: () => void;
}

export function ExamCreateDialog({
  open,
  pending = false,
  courses,
  templates,
  quizzes,
  onOpenChange,
  onCreate,
  onCreateTemplate,
}: ExamCreateDialogProps) {
  const { t } = useTranslation("exam");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [sectionQuiz, setSectionQuiz] = useState<Record<string, string>>({});
  const [sectionMinutes, setSectionMinutes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((item) => item.id === templateId) ?? null;
  const sections = useMemo(
    () => (template?.items ?? []).filter((item) => item.kind === "section"),
    [template]
  );
  const usableQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.status === "published" && quiz.questionCount > 0),
    [quizzes]
  );

  function close() {
    setTemplateId("");
    setTitle("");
    setStartsAt("");
    setSectionQuiz({});
    setSectionMinutes({});
    setError(null);
    onOpenChange(false);
  }

  function submit() {
    if (!courseId) {
      setError(t("createDialog.validation.chooseCourse"));
      return;
    }
    if (!template) {
      setError(t("createDialog.validation.chooseTemplate"));
      return;
    }
    if (!title.trim()) {
      setError(t("createDialog.validation.enterTitle"));
      return;
    }
    if (!startsAt) {
      setError(t("createDialog.validation.chooseStart"));
      return;
    }
    if (new Date(startsAt).getTime() <= Date.now()) {
      setError(t("createDialog.validation.startInFuture"));
      return;
    }
    const missing = sections.find((section) => !sectionQuiz[section.key]);
    if (missing) {
      setError(t("createDialog.validation.chooseQuiz", { title: missing.title }));
      return;
    }
    const used = new Set<string>();
    for (const section of sections) {
      const quizId = sectionQuiz[section.key];
      if (used.has(quizId)) {
        setError(t("createDialog.validation.quizTwice"));
        return;
      }
      used.add(quizId);
    }

    onCreate({
      courseId,
      templateId: template.id,
      title: title.trim(),
      startsAt,
      sections: sections.map((section) => ({
        key: section.key,
        quizId: sectionQuiz[section.key],
        ...(sectionMinutes[section.key] ? { minutes: Number(sectionMinutes[section.key]) } : {}),
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      {open ? (
        <DialogContent
          className="group-action-dialog exam-create-dialog"
          title={t("createDialog.title")}
          description={t("createDialog.description")}
        >
          <div className="group-action-form">
            {courses.length > 1 ? (
              <SelectPicker
                label={t("createDialog.courseLabel")}
                icon={BookOpen}
                searchable
                value={courseId}
                onChange={(value) => {
                  setCourseId(value);
                  setError(null);
                }}
                options={courses.map((course) => ({ value: course.id, label: course.title }))}
              />
            ) : null}

            <SelectPicker
              label={t("createDialog.templateLabel")}
              icon={LayoutList}
              value={templateId}
              onChange={(value) => {
                setTemplateId(value);
                setSectionQuiz({});
                setSectionMinutes({});
                setError(null);
              }}
              options={templates.map((item) => ({
                value: item.id,
                label: item.kind === "custom" ? `${item.name} · ${t("createDialog.customTag")}` : item.name,
              }))}
            />
            <button type="button" className="exam-template-link" onClick={onCreateTemplate}>
              {t("createDialog.newTemplate")}
            </button>

            <label className="field-group">
              <span>{t("createDialog.titleLabel")}</span>
              <div className="input-shell">
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError(null);
                  }}
                  placeholder={t("createDialog.titlePlaceholder")}
                />
              </div>
            </label>

            <DatePicker
              label={t("createDialog.startLabel")}
              value={startsAt}
              onChange={(value) => {
                setStartsAt(value);
                setError(null);
              }}
              includeTime
            />

            {template ? (
              <div className="exam-section-list">
                <span className="exam-section-list-head">{t("createDialog.sectionsHead")}</span>
                {template.items.map((item) =>
                  item.kind === "section" ? (
                    <div key={item.key} className="exam-section-row">
                      <div className="exam-section-row-title">
                        <strong>{item.title}</strong>
                        <small>
                          {item.minutes ? t("createDialog.defaultMinutes", { count: item.minutes }) : ""}
                          {item.manual ? ` · ${t("createDialog.manualSection")}` : ""}
                        </small>
                      </div>
                      <div className="exam-section-row-quiz">
                        <SelectPicker
                          label={t("createDialog.quizLabel")}
                          hideLabel
                          searchable
                          value={sectionQuiz[item.key] ?? ""}
                          onChange={(value) => {
                            setSectionQuiz((current) => ({ ...current, [item.key]: value }));
                            setError(null);
                          }}
                          options={usableQuizzes.map((quiz) => ({
                            value: quiz.id,
                            label: `${quiz.title || quiz.topic} · ${quiz.questionCount}`,
                          }))}
                        />
                      </div>
                      <label className="exam-template-minutes">
                        <input
                          type="number"
                          min={1}
                          value={sectionMinutes[item.key] ?? ""}
                          placeholder={String(item.minutes ?? "")}
                          onChange={(event) =>
                            setSectionMinutes((current) => ({ ...current, [item.key]: event.target.value }))
                          }
                          aria-label={t("createDialog.minutesLabel", { title: item.title })}
                        />
                        <span>{t("templateDialog.minutesShort")}</span>
                      </label>
                    </div>
                  ) : (
                    <div key={item.key} className="exam-section-row is-muted">
                      <div className="exam-section-row-title">
                        <strong>
                          {item.kind === "break" ? <Coffee size={14} /> : null} {item.title}
                        </strong>
                        <small>
                          {item.kind === "break"
                            ? t("createDialog.breakMinutes", { count: item.minutes ?? 0 })
                            : t("createDialog.offlineSection")}
                        </small>
                      </div>
                    </div>
                  )
                )}
                {!usableQuizzes.length ? (
                  <small className="exam-section-hint">{t("createDialog.noQuizzes")}</small>
                ) : null}
              </div>
            ) : null}

            {error ? <div className="form-alert">{error}</div> : null}

            <div className="dialog-actions">
              <Button type="button" variant="secondary" onClick={close}>
                {t("createDialog.cancel")}
              </Button>
              <Button type="button" loading={pending} onClick={submit}>
                {t("createDialog.submit")}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, Download, FileUp, Link2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type {
  QuizDetail,
  QuizEditValues,
  QuizFormValues,
  QuizImportPreview,
  QuizImportWarning,
} from "@/shared/types";
import {
  useDownloadQuizTemplate,
  useImportGoogleLink,
  useImportQuizDocx,
  useQuizDetailLoader,
} from "../model/quiz.queries";
import {
  createDraft,
  draftToFormValues,
  formValuesToDraft,
  hasDraftContent,
  questionToDraft,
  validateDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import { detectGoogleSource } from "../lib/google-import";
import { QuestionEditor } from "./question-editor";
import { QuizPreview } from "./quiz-preview";

const TEMPLATE_QUESTION_COUNT = 10;

function warningKey(reason: string): "answerNotDetected" | "notEnoughOptions" | "unsupportedType" {
  if (reason === "answer_not_detected") return "answerNotDetected";
  if (reason === "unsupported_type") return "unsupportedType";
  return "notEnoughOptions";
}

export interface AddQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: QuizFormValues) => void;
  courses: Array<{ id: string; title: string }>;
  subjects?: ReadonlyArray<{ value: string; label: string }>;
  showSchedule?: boolean;
  existingQuizzes?: ReadonlyArray<{ id: string; title: string }>;
  editQuiz?: QuizDetail | null;
  questionsLocked?: boolean;
  saving?: boolean;
  onUpdate?: (values: QuizEditValues) => void;
}

export function AddQuizDialog({
  open,
  onOpenChange,
  onCreate,
  courses,
  subjects,
  showSchedule = false,
  existingQuizzes = [],
  editQuiz = null,
  questionsLocked = false,
  saving = false,
  onUpdate,
}: AddQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const nextKey = useRef(0);
  function newKey() {
    nextKey.current += 1;
    return `k${nextKey.current}`;
  }

  const [step, setStep] = useState<"details" | "questions">("details");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const subjectMode = Boolean(subjects);
  const courseId = subjectMode ? "" : selectedCourseId || courses[0]?.id || "";
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState(editQuiz?.title ?? "");
  const [topic, setTopic] = useState(editQuiz?.topic ?? "");
  const [dueAt, setDueAt] = useState(editQuiz?.dueAt ?? "");
  const [opensAt, setOpensAt] = useState(editQuiz?.opensAt ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    editQuiz ? editQuiz.questions.map((question) => questionToDraft(question, newKey)) : []
  );
  const [error, setError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const titleComboRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importWarnings, setImportWarnings] = useState<QuizImportWarning[]>([]);
  const loadQuizDetail = useQuizDetailLoader();
  const importFile = useImportQuizDocx();
  const importGoogle = useImportGoogleLink();
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");
  const downloadTemplate = useDownloadQuizTemplate();

  const missingAnswerWarnings = importWarnings.filter(
    (warning) => warning.reason === "answer_not_detected"
  );
  const allAnswersMissing = questions.length > 0 && missingAnswerWarnings.length >= questions.length;
  const listedWarnings = allAnswersMissing
    ? importWarnings.filter((warning) => warning.reason !== "answer_not_detected")
    : importWarnings;

  const suggestions = useMemo(() => {
    const query = title.trim().toLowerCase();
    const named = existingQuizzes.filter((quiz) => quiz.title);
    if (!query) return named;
    return named.filter(
      (quiz) => quiz.title.toLowerCase().includes(query) && quiz.title.toLowerCase() !== query
    );
  }, [existingQuizzes, title]);

  const editing = Boolean(editQuiz);

  useEffect(() => {
    if (!suggestOpen) return undefined;
    function handlePointerDown(event: PointerEvent) {
      if (titleComboRef.current?.contains(event.target as Node)) return;
      setSuggestOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [suggestOpen]);

  async function copyFromQuiz(quiz: { id: string; title: string }) {
    setSuggestOpen(false);
    setTitle(quiz.title);
    if (questions.some(hasDraftContent) && !window.confirm(t("createDialog.copyConfirm", { title: quiz.title }))) {
      return;
    }
    setCopyingId(quiz.id);
    try {
      const detail = await loadQuizDetail(quiz.id);
      setQuestions(detail.questions.map((question) => questionToDraft(question, newKey)));
      setCopiedFrom(quiz.title);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("createDialog.copyFailed"));
    } finally {
      setCopyingId(null);
    }
  }

  function applyPreview(preview: QuizImportPreview) {
    setTitle(title.trim() || preview.title.trim());
    setCopiedFrom(null);
    setQuestions(preview.questions.map((question) => formValuesToDraft(question, newKey)));
    setImportWarnings(preview.warnings);
    setGoogleOpen(false);
    setGoogleUrl("");
    setError(null);
    setStep("questions");
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const missingTarget = targetError();
    if (missingTarget) {
      setError(missingTarget);
      return;
    }
    importFile.mutate(file, { onSuccess: applyPreview });
  }

  function handleImportGoogle() {
    const missingTarget = targetError();
    if (missingTarget) {
      setError(missingTarget);
      return;
    }
    const source = detectGoogleSource(googleUrl);
    if (!source) {
      setError(t("createDialog.googleLinkInvalid"));
      return;
    }
    importGoogle.mutate({ source, url: googleUrl.trim() }, { onSuccess: applyPreview });
  }

  function newQuestion(type: QuestionDraft["type"] = "single") {
    return createDraft(type, newKey);
  }

  function reset() {
    setStep("details");
    setSelectedCourseId("");
    setSubject("");
    setTitle("");
    setTopic("");
    setDueAt("");
    setOpensAt("");
    setQuestions([]);
    setImportWarnings([]);
    setGoogleOpen(false);
    setGoogleUrl("");
    setCopiedFrom(null);
    setCopyingId(null);
    setError(null);
  }

  function targetError(): string | null {
    if (!editing && subjectMode && !subject) return t("createDialog.validation.chooseSubject");
    if (!editing && !subjectMode && !courseId) return t("createDialog.validation.chooseCourse");
    return topic.trim() ? null : t("createDialog.validation.enterTopic");
  }

  function goToQuestions() {
    const missingTarget = targetError();
    if (missingTarget) {
      setError(missingTarget);
      return;
    }
    setError(null);
    if (!questions.length) setQuestions([newQuestion()]);
    setStep("questions");
  }

  function addQuestion() {
    setQuestions((current) => [...current, newQuestion(current[current.length - 1]?.type)]);
  }

  function removeQuestion(questionKey: string) {
    setQuestions((current) => current.filter((question) => question.key !== questionKey));
  }

  function updateQuestion(questionKey: string, update: (draft: QuestionDraft) => QuestionDraft) {
    setQuestions((current) =>
      current.map((question) => (question.key === questionKey ? update(question) : question))
    );
  }

  function validate(): string | null {
    const missingTarget = targetError();
    if (missingTarget) return missingTarget;
    if (questionsLocked) return null;
    if (!questions.length) return t("createDialog.validation.addQuestion");
    for (const [index, question] of questions.entries()) {
      const draftError = validateDraft(question);
      if (draftError) {
        return t("createDialog.validation.questionPrefix", {
          number: index + 1,
          message: t(`createDialog.validation.${draftError}`, {
            syntax: `{{${t("editor.blankWord")}}}`,
            interpolation: { escapeValue: false },
          }),
          interpolation: { escapeValue: false },
        });
      }
    }
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (editing) {
      onUpdate?.({
        topic: topic.trim(),
        title: title.trim(),
        dueAt: dueAt || null,
        opensAt: opensAt || null,
        ...(questionsLocked ? {} : { questions: questions.map(draftToFormValues) }),
      });
      return;
    }
    onCreate({
      courseId,
      subject: subjectMode ? subject : undefined,
      lessonId: null,
      title: title.trim(),
      topic: topic.trim(),
      description: "",
      dueAt: dueAt || null,
      opensAt: opensAt || null,
      questions: questions.map(draftToFormValues),
    });
    reset();
    onOpenChange(false);
  }

  if (!open) return null;

  if (step === "questions") {
    return (
      <div className="quiz-page">
        <div className="quiz-page-header">
          <div>
            <span className="quiz-page-eyebrow">{title.trim() || topic.trim() || t("createDialog.title")}</span>
            <h2>
              {questionsLocked
                ? t("editDialog.lockedPageTitle")
                : editing
                  ? t("editDialog.questionsPageTitle")
                  : t("createDialog.questionsPageTitle")}
            </h2>
          </div>
          <div className="quiz-page-header-actions">
            <Button type="button" variant="ghost" onClick={() => setStep("details")}>
              {t("createDialog.backButton")}
            </Button>
            <Button type="submit" form="quiz-questions-form" loading={saving}>
              {editing ? t("editDialog.save") : t("createDialog.create")}
            </Button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("createDialog.cancel")}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {error ? <div className="form-alert quiz-page-alert">{error}</div> : null}

        {importWarnings.length ? (
          <div className="form-alert form-alert--warning quiz-page-alert">
            {allAnswersMissing ? <p>{t("createDialog.importWarningAllAnswersMissing")}</p> : null}
            {listedWarnings.map((warning) => (
              <p key={`${warning.questionNumber}-${warning.reason}`}>
                {t(`createDialog.importWarning.${warningKey(warning.reason)}`, {
                  number: warning.questionNumber,
                })}
              </p>
            ))}
          </div>
        ) : null}

        {questionsLocked ? (
          <div className="form-alert form-alert--warning quiz-page-alert">{t("editDialog.lockedNotice")}</div>
        ) : null}

        <div className={`quiz-page-split ${questionsLocked ? "is-locked" : ""}`}>
          <form id="quiz-questions-form" className="quiz-page-body" onSubmit={submit}>
          {questionsLocked
            ? null
            : questions.map((question, index) => (
                <QuestionEditor
                  key={question.key}
                  draft={question}
                  index={index}
                  canRemove={questions.length > 1}
                  newKey={newKey}
                  onChange={(update) => updateQuestion(question.key, update)}
                  onRemove={() => removeQuestion(question.key)}
                />
              ))}
          {questionsLocked ? null : (
            <button type="button" className="quiz-page-add-question" onClick={addQuestion}>
              <Plus size={16} /> {t("createDialog.addQuestion")}
            </button>
          )}
          </form>

          <QuizPreview title={title} questions={questions} />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="group-action-dialog"
        title={editing ? t("editDialog.title") : t("createDialog.title")}
        description={editing ? t("editDialog.description") : t("createDialog.description")}
      >
        <motion.div
          className="group-action-form"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {editing ? null : subjects ? (
            <SelectPicker
              label={t("createDialog.subjectLabel")}
              icon={BookOpen}
              searchable
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setError(null);
              }}
              options={subjects.map((item) => ({ value: item.value, label: item.label }))}
            />
          ) : courses.length > 1 ? (
            <SelectPicker
              label={t("createDialog.courseLabel")}
              icon={BookOpen}
              value={courseId}
              onChange={(value) => setSelectedCourseId(value)}
              options={courses.map((course) => ({ value: course.id, label: course.title }))}
            />
          ) : null}
          <label className="quiz-topic-field">
            {t("createDialog.topicLabel")}
            <input
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setError(null);
              }}
              placeholder={t("createDialog.topicPlaceholder")}
            />
          </label>
          <div className="quiz-title-field">
            <span className="quiz-title-field-label">{t("createDialog.titleLabel")}</span>
            <div className="quiz-title-combo" ref={titleComboRef}>
              <input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setCopiedFrom(null);
                  setSuggestOpen(true);
                }}
                onClick={() => setSuggestOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && suggestOpen) {
                    event.stopPropagation();
                    setSuggestOpen(false);
                  }
                }}
                placeholder={t("createDialog.titlePlaceholder")}
                role="combobox"
                aria-expanded={suggestOpen && suggestions.length > 0}
                aria-autocomplete="list"
              />
              {existingQuizzes.length ? (
                <button
                  type="button"
                  className={`quiz-title-combo-toggle ${suggestOpen ? "is-open" : ""}`}
                  aria-label={t("createDialog.existingTitlesAria")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSuggestOpen((current) => !current)}
                >
                  <ChevronDown size={16} />
                </button>
              ) : null}
              {suggestOpen && suggestions.length ? (
                <div className="quiz-title-suggest" role="listbox">
                  <span className="quiz-title-suggest-head">{t("createDialog.existingTitlesLabel")}</span>
                  {suggestions.map((quiz) => (
                    <button
                      key={quiz.id}
                      type="button"
                      role="option"
                      aria-selected={quiz.title === title}
                      disabled={copyingId !== null}
                      onClick={() => void copyFromQuiz(quiz)}
                    >
                      {quiz.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {copyingId ? (
              <small className="quiz-title-hint">{t("createDialog.copyLoading")}</small>
            ) : copiedFrom ? (
              <small className="quiz-title-hint is-done">
                {t("createDialog.copyDone", { title: copiedFrom, count: questions.length })}
              </small>
            ) : null}
          </div>
          {showSchedule ? (
            <div className="form-grid-two">
              <DatePicker
                label={t("createDialog.dueLabel")}
                value={dueAt}
                onChange={setDueAt}
                includeTime
                optional
              />
              <DatePicker
                label={t("createDialog.opensLabel")}
                value={opensAt}
                onChange={setOpensAt}
                includeTime
                optional
              />
            </div>
          ) : null}

          {editing ? null : (
            <>
          <div className="quiz-import-row">
            <span className="quiz-template-gen-or">{t("createDialog.importOr")}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx"
              hidden
              onChange={handleImportFile}
            />
            <button
              type="button"
              className="quiz-generate-button quiz-generate-button--ghost"
              disabled={importFile.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={14} />{" "}
              {importFile.isPending ? t("createDialog.importButtonLoading") : t("createDialog.importButton")}
            </button>
            <button
              type="button"
              className={`quiz-generate-button quiz-generate-button--ghost ${googleOpen ? "is-active" : ""}`}
              aria-expanded={googleOpen}
              onClick={() => {
                setGoogleOpen((current) => !current);
                setError(null);
              }}
            >
              <Link2 size={14} /> {t("createDialog.googleImportButton")}
            </button>
          </div>

          {googleOpen ? (
            <div className="quiz-google-import">
              <input
                autoFocus
                value={googleUrl}
                onChange={(event) => {
                  setGoogleUrl(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleImportGoogle();
                  }
                }}
                placeholder={t("createDialog.googleLinkPlaceholder")}
              />
              <button
                type="button"
                className="quiz-generate-button"
                disabled={importGoogle.isPending || !googleUrl.trim()}
                onClick={handleImportGoogle}
              >
                {importGoogle.isPending ? t("createDialog.importButtonLoading") : t("createDialog.googleImportSubmit")}
              </button>
              <small>{t("createDialog.googleShareHint")}</small>
            </div>
          ) : null}

          <div className="quiz-template-download">
            <span className="quiz-template-download-label">{t("createDialog.downloadTemplateLabel")}</span>
            <button
              type="button"
              className="quiz-generate-button quiz-generate-button--ghost"
              disabled={downloadTemplate.isPending}
              onClick={() => downloadTemplate.mutate({ type: "docx", count: TEMPLATE_QUESTION_COUNT })}
            >
              <Download size={14} /> {t("createDialog.downloadTemplateWord")}
            </button>
            <button
              type="button"
              className="quiz-generate-button quiz-generate-button--ghost"
              disabled={downloadTemplate.isPending}
              onClick={() => downloadTemplate.mutate({ type: "xlsx", count: TEMPLATE_QUESTION_COUNT })}
            >
              <Download size={14} /> {t("createDialog.downloadTemplateExcel")}
            </button>
          </div>

            </>
          )}

          {error ? <div className="form-alert">{error}</div> : null}

          <div className="dialog-actions">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("createDialog.cancel")}
            </Button>
            <Button type="button" onClick={goToQuestions}>
              {editing ? t("editDialog.continueButton") : t("createDialog.continueButton")}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

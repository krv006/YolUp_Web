import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, Download, FileUp, Link2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";

const HEADER_PRIMARY =
  "flex h-11 shrink-0 items-center rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-50";
const HEADER_SECONDARY =
  "flex h-11 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50";
const IMPORT_BUTTON =
  "flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50";
import type {
  QuizDetail,
  QuizEditValues,
  QuizFormValues,
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
  hasDraftContent,
  questionToDraft,
  validateDraft,
  type GroupDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import type { ImportedQuiz } from "../api/quiz.api";
import { detectGoogleSource } from "../lib/google-import";
import { QuestionEditor } from "./question-editor";
import { QuestionGroupEditor } from "./question-group-editor";
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
  initialWarnings?: QuizImportWarning[];
  startOnQuestions?: boolean;
  questionsLocked?: boolean;
  saving?: boolean;
  publishing?: boolean;
  publishError?: string | null;
  uploadingAudio?: boolean;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
  onUpdate?: (values: QuizEditValues) => void;
  onPublish?: () => void;
  onImported?: (result: ImportedQuiz) => void;
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
  initialWarnings = [],
  startOnQuestions = false,
  questionsLocked = false,
  saving = false,
  publishing = false,
  publishError = null,
  uploadingAudio = false,
  onUploadAudio,
  onRemoveAudio,
  onUpdate,
  onPublish,
  onImported,
}: AddQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const nextKey = useRef(0);
  function newKey() {
    nextKey.current += 1;
    return `k${nextKey.current}`;
  }

  const [step, setStep] = useState<"details" | "questions">(startOnQuestions ? "questions" : "details");
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
  const [groups, setGroups] = useState<GroupDraft[]>(() =>
    (editQuiz?.groups ?? []).map((group) => ({
      key: group.id,
      id: group.id,
      title: group.title,
      passage: group.passage,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const titleComboRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveAsDraftRef = useRef(false);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [answerWarningOpen, setAnswerWarningOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [fieldErrors, setFieldErrors] = useState<{ target?: string; topic?: string }>({});
  const [importWarnings, setImportWarnings] = useState<QuizImportWarning[]>(initialWarnings);
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
  const isDraft = editQuiz?.status === "draft";

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

  function importRequest() {
    return {
      topic: topic.trim(),
      courseId: subjectMode ? null : courseId,
      subject: subjectMode ? subject : undefined,
      title: title.trim(),
    };
  }

  function applyImported(result: ImportedQuiz) {
    setGoogleOpen(false);
    setGoogleUrl("");
    setError(null);
    onImported?.(result);
    reset();
    onOpenChange(false);
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
    importFile.mutate({ file, request: importRequest() }, { onSuccess: applyImported });
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
    importGoogle.mutate(
      { source, url: googleUrl.trim(), request: importRequest() },
      { onSuccess: applyImported }
    );
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
    const next: { target?: string; topic?: string } = {};
    if (!editing && subjectMode && !subject) next.target = t("createDialog.validation.chooseSubject");
    if (!editing && !subjectMode && !courseId) next.target = t("createDialog.validation.chooseCourse");
    if (!topic.trim()) next.topic = t("createDialog.validation.enterTopicOrImport");
    setFieldErrors(next);
    if (next.target || next.topic) return;
    setError(null);
    if (!questions.length) setQuestions([newQuestion()]);
    setStep("questions");
  }

  function markDirty() {
    setDirtyCount((count) => count + 1);
  }

  function addQuestion() {
    markDirty();
    setQuestions((current) => [...current, newQuestion(current[current.length - 1]?.type)]);
  }

  function removeQuestion(questionKey: string) {
    markDirty();
    setQuestions((current) => current.filter((question) => question.key !== questionKey));
  }

  function updateQuestion(questionKey: string, update: (draft: QuestionDraft) => QuestionDraft) {
    markDirty();
    setQuestions((current) =>
      current.map((question) => (question.key === questionKey ? update(question) : question))
    );
  }

  const missingAnswerNumbers = questions
    .map((question, index) => (validateDraft(question) ? index + 1 : 0))
    .filter((number, index) => number > 0 && Boolean(validateDraft(questions[index])));

  function validate(asDraft: boolean): string | null {
    const missingTarget = targetError();
    if (missingTarget) return missingTarget;
    if (questionsLocked) return null;
    if (!questions.length) return t("createDialog.validation.addQuestion");
    for (const [index, question] of questions.entries()) {
      const draftError = validateDraft(question, { allowMissingAnswer: asDraft });
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

  function groupsPayload() {
    return groups.map((group) => ({
      ...(group.id ? { id: group.id } : {}),
      title: group.title.trim(),
      passage: group.passage.trim(),
    }));
  }

  function questionsPayload() {
    return questions.map((question) => {
      const index = groups.findIndex((group) => group.key === question.groupKey);
      return draftToFormValues(question, index >= 0 ? index : null);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDirtyCount(0);
    const asDraft = saveAsDraftRef.current;
    saveAsDraftRef.current = false;
    const validationError = validate(asDraft || isDraft);
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
        groups: groupsPayload(),
        ...(questionsLocked ? {} : { questions: questionsPayload() }),
      });
      return;
    }
    onCreate({
      courseId,
      subject: subjectMode ? subject : undefined,
      status: asDraft ? "draft" : undefined,
      lessonId: null,
      title: title.trim(),
      topic: topic.trim(),
      description: "",
      dueAt: dueAt || null,
      opensAt: opensAt || null,
      groups: groupsPayload(),
      questions: questionsPayload(),
    });
    reset();
    onOpenChange(false);
  }

  if (!open) return null;

  if (step === "questions") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:h-[72px] lg:px-6">
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate font-heading text-h3 text-ink">
              {questionsLocked
                ? t("editDialog.lockedPageTitle")
                : editing
                  ? t("editDialog.questionsPageTitle")
                  : t("createDialog.questionsPageTitle")}
            </strong>
            <small className="truncate text-caption text-ink-tertiary">
              {[
                title.trim() || topic.trim(),
                isDraft ? t("teacherPage.draftBadge") : "",
                t("teacherPage.questionCount", { count: questions.length }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </small>
          </span>

          <button
            type="button"
            className="hidden h-11 items-center rounded-full px-4 text-label-strong text-ink-secondary transition-colors hover:bg-subtle lg:flex"
            onClick={() => setStep("details")}
          >
            {t("createDialog.backButton")}
          </button>

          {editing ? null : (
            <button
              type="submit"
              form="quiz-questions-form"
              className={`${HEADER_SECONDARY} hidden lg:flex`}
              disabled={saving}
              onClick={() => {
                saveAsDraftRef.current = true;
              }}
            >
              {t("createDialog.saveDraft")}
            </button>
          )}

          <button
            type="submit"
            form="quiz-questions-form"
            className={`${isDraft ? HEADER_SECONDARY : HEADER_PRIMARY} hidden lg:flex`}
            disabled={saving}
          >
            {editing ? t("editDialog.save") : t("createDialog.create")}
          </button>

          {isDraft ? (
            <button
              type="button"
              className={`${HEADER_PRIMARY} hidden lg:flex`}
              disabled={publishing}
              onClick={() => {
                if (missingAnswerNumbers.length) {
                  setAnswerWarningOpen(true);
                  return;
                }
                onPublish?.();
              }}
            >
              {t("editDialog.publish")}
            </button>
          ) : null}

          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            aria-label={t("createDialog.cancel")}
            onClick={() => {
              if (dirtyCount > 0) {
                setCloseConfirmOpen(true);
                return;
              }
              reset();
              onOpenChange(false);
            }}
          >
            <X size={19} />
          </button>
        </header>

        <div className="flex shrink-0 items-center gap-1 rounded-full bg-subtle p-1 mx-4 mt-3 lg:hidden">
          {(["edit", "preview"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`h-10 flex-1 rounded-full text-label-strong transition-colors ${
                mobileTab === item ? "bg-surface text-ink shadow-xs" : "text-ink-secondary"
              }`}
              onClick={() => setMobileTab(item)}
            >
              {t(`createDialog.tab.${item}`)}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:gap-6 lg:p-6">
          <div
            className={`min-w-0 flex-1 flex-col gap-4 lg:flex ${
              mobileTab === "edit" ? "flex" : "hidden"
            }`}
          >
            {error ? (
              <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">{error}</p>
            ) : null}
            {publishError ? (
              <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">
                {publishError}
              </p>
            ) : null}
            {isDraft ? (
              <p className="flex items-start gap-2.5 rounded-xl bg-saffron-subtle px-4 py-3 text-body-sm text-ink">
                <span className="text-saffron-strong">i</span>
                {t("editDialog.draftNotice")}
              </p>
            ) : null}
            {importWarnings.length ? (
              <div className="flex flex-col gap-1 rounded-xl bg-saffron-subtle px-4 py-3 text-body-sm text-ink">
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
              <p className="rounded-xl bg-saffron-subtle px-4 py-3 text-body-sm text-ink">
                {t("editDialog.lockedNotice")}
              </p>
            ) : null}

            <form id="quiz-questions-form" className="flex flex-col gap-4" onSubmit={submit}>
              <QuestionGroupEditor
                groups={groups}
                savedGroups={editQuiz?.groups ?? []}
                uploading={Boolean(uploadingAudio)}
                onChange={(next) => {
                  markDirty();
                  setGroups(next);
                }}
                onUploadAudio={onUploadAudio}
                onRemoveAudio={onRemoveAudio}
              />

              {questionsLocked
                ? null
                : questions.map((question, index) => (
                    <QuestionEditor
                      key={question.key}
                      draft={question}
                      groups={groups}
                      index={index}
                      canRemove={questions.length > 1}
                      newKey={newKey}
                      onChange={(update) => updateQuestion(question.key, update)}
                      onRemove={() => removeQuestion(question.key)}
                    />
                  ))}

              {questionsLocked ? null : (
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-label-strong text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
                  onClick={addQuestion}
                >
                  <Plus size={16} /> {t("createDialog.addQuestion")}
                </button>
              )}
            </form>
          </div>

          <aside
            className={`w-full shrink-0 flex-col gap-3 lg:flex lg:w-[380px] ${
              mobileTab === "preview" ? "flex" : "hidden"
            }`}
          >
            <QuizPreview title={title} questions={questions} />
          </aside>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-line bg-surface px-4 py-3 lg:hidden">
          <button
            type="submit"
            form="quiz-questions-form"
            className={`${HEADER_SECONDARY} h-12 flex-1 justify-center`}
            disabled={saving}
          >
            {editing ? t("editDialog.save") : t("createDialog.saveDraft")}
          </button>
          {isDraft ? (
            <button
              type="button"
              className={`${HEADER_PRIMARY} h-12 flex-1 justify-center`}
              disabled={publishing}
              onClick={() => {
                if (missingAnswerNumbers.length) {
                  setAnswerWarningOpen(true);
                  return;
                }
                onPublish?.();
              }}
            >
              {t("editDialog.publish")}
            </button>
          ) : (
            <button
              type="submit"
              form="quiz-questions-form"
              className={`${HEADER_PRIMARY} h-12 flex-1 justify-center`}
              disabled={saving}
            >
              {editing ? t("editDialog.save") : t("createDialog.create")}
            </button>
          )}
        </div>

        <AppDialog
          open={closeConfirmOpen}
          onOpenChange={setCloseConfirmOpen}
          variant="confirm"
          title={t("createDialog.unsavedTitle")}
          description={t("createDialog.unsavedDescription", { count: dirtyCount })}
          footer={
            <>
              <button
                type="button"
                className={dialogButton.secondary}
                onClick={() => setCloseConfirmOpen(false)}
              >
                {t("createDialog.unsavedStay")}
              </button>
              <button
                type="button"
                className={dialogButton.danger}
                onClick={() => {
                  setCloseConfirmOpen(false);
                  reset();
                  onOpenChange(false);
                }}
              >
                {t("createDialog.unsavedLeave")}
              </button>
            </>
          }
        />

        <AppDialog
          open={answerWarningOpen}
          onOpenChange={setAnswerWarningOpen}
          variant="confirm"
          icon={
            <span className="grid size-9 place-items-center rounded-full bg-saffron-subtle text-saffron-strong">
              <X size={18} />
            </span>
          }
          title={t("createDialog.missingAnswersTitle", { count: missingAnswerNumbers.length })}
          description={t("createDialog.missingAnswersDescription", {
            count: missingAnswerNumbers.length,
            list: missingAnswerNumbers.join(", "),
          })}
          footer={
            <>
              <button
                type="button"
                className={dialogButton.secondary}
                onClick={() => setAnswerWarningOpen(false)}
              >
                {t("createDialog.missingAnswersLater")}
              </button>
              <button
                type="button"
                className={dialogButton.primary}
                onClick={() => {
                  setAnswerWarningOpen(false);
                  const first = missingAnswerNumbers[0];
                  if (!first) return;
                  const cards = document.querySelectorAll(".quiz-page-question");
                  cards[first - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {t("createDialog.missingAnswersGo")}
              </button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-[560px]"
      title={editing ? t("editDialog.title") : t("createDialog.title")}
      description={editing ? t("editDialog.description") : t("createDialog.description")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("createDialog.cancel")}
          </button>
          <button type="button" className={dialogButton.primary} onClick={goToQuestions}>
            {editing ? t("editDialog.continueButton") : t("createDialog.continueButton")}
          </button>
        </>
      }
    >
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {editing ? null : subjects ? (
          <div className={`flex flex-col gap-1.5 ${fieldErrors.target ? "field-invalid" : ""}`}>
            <SelectPicker
              label={t("createDialog.subjectLabel")}
              icon={BookOpen}
              searchable
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setError(null);
                setFieldErrors((current) => ({ ...current, target: undefined }));
              }}
              options={subjects.map((item) => ({ value: item.value, label: item.label }))}
            />
            {fieldErrors.target ? (
              <small className="flex items-center gap-1.5 px-1 text-caption text-error-text">
                <X size={13} /> {fieldErrors.target}
              </small>
            ) : null}
          </div>
        ) : courses.length > 1 ? (
          <SelectPicker
            label={t("createDialog.courseLabel")}
            icon={BookOpen}
            value={courseId}
            onChange={(value) => setSelectedCourseId(value)}
            options={courses.map((course) => ({ value: course.id, label: course.title }))}
          />
        ) : null}

        <label className={`field-group ${fieldErrors.topic ? "field-invalid" : ""}`}>
          <span>{t("createDialog.topicLabel")}</span>
          <input
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setError(null);
              setFieldErrors((current) => ({ ...current, topic: undefined }));
            }}
            placeholder={t("createDialog.topicPlaceholder")}
          />
          {fieldErrors.topic ? (
            <small className="flex items-center gap-1.5 px-1 text-caption text-error-text">
              <X size={13} /> {fieldErrors.topic}
            </small>
          ) : null}
        </label>

        <div className="field-group">
          <span>{t("createDialog.titleLabel")}</span>
          <div className="relative" ref={titleComboRef}>
            <input
              autoFocus
              className="h-12 w-full rounded-xl border border-line bg-canvas px-4 text-body text-ink outline-none"
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
                className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
                aria-label={t("createDialog.existingTitlesAria")}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setSuggestOpen((current) => !current)}
              >
                <ChevronDown size={16} className={suggestOpen ? "rotate-180" : ""} />
              </button>
            ) : null}
            {suggestOpen && suggestions.length ? (
              <div
                className="absolute inset-x-0 top-full z-20 mt-1 flex max-h-[220px] flex-col overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-xl"
                role="listbox"
              >
                <span className="px-4 py-1.5 text-caption-strong text-ink-tertiary">
                  {t("createDialog.existingTitlesLabel")}
                </span>
                {suggestions.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    role="option"
                    className="px-4 py-2 text-left text-body-sm text-ink transition-colors hover:bg-subtle"
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
            <small className="px-1 text-caption text-ink-tertiary">
              {t("createDialog.copyLoading")}
            </small>
          ) : copiedFrom ? (
            <small className="px-1 text-caption text-success-text">
              {t("createDialog.copyDone", { title: copiedFrom, count: questions.length })}
            </small>
          ) : null}
        </div>

        {showSchedule ? (
          <div className="grid gap-4 sm:grid-cols-2">
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
            <span className="flex items-center gap-3 text-caption text-ink-tertiary">
              <span className="h-px flex-1 bg-line" />
              {t("createDialog.importOr")}
              <span className="h-px flex-1 bg-line" />
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.json"
              hidden
              onChange={handleImportFile}
            />
            <button
              type="button"
              className={IMPORT_BUTTON}
              disabled={importFile.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={17} />
              {importFile.isPending
                ? t("createDialog.importButtonLoading")
                : t("createDialog.importButton")}
            </button>
            <button
              type="button"
              className={`${IMPORT_BUTTON} ${googleOpen ? "border-action text-action" : ""}`}
              aria-expanded={googleOpen}
              onClick={() => {
                setGoogleOpen((current) => !current);
                setError(null);
              }}
            >
              <Link2 size={17} /> {t("createDialog.googleImportButton")}
            </button>

            {googleOpen ? (
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
                <input
                  autoFocus
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-body-sm text-ink outline-none"
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
                  className="flex h-11 items-center justify-center rounded-lg bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-50"
                  disabled={importGoogle.isPending || !googleUrl.trim()}
                  onClick={handleImportGoogle}
                >
                  {importGoogle.isPending
                    ? t("createDialog.importButtonLoading")
                    : t("createDialog.googleImportSubmit")}
                </button>
                <small className="text-caption text-ink-tertiary">
                  {t("createDialog.googleShareHint")}
                </small>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 rounded-xl bg-subtle p-3">
              <span className="text-caption text-ink-secondary">
                {t("createDialog.downloadTemplateLabel")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={IMPORT_BUTTON}
                  disabled={downloadTemplate.isPending}
                  onClick={() => downloadTemplate.mutate({ type: "docx", count: TEMPLATE_QUESTION_COUNT })}
                >
                  <Download size={16} /> {t("createDialog.downloadTemplateWord")}
                </button>
                <button
                  type="button"
                  className={IMPORT_BUTTON}
                  disabled={downloadTemplate.isPending}
                  onClick={() => downloadTemplate.mutate({ type: "xlsx", count: TEMPLATE_QUESTION_COUNT })}
                >
                  <Download size={16} /> {t("createDialog.downloadTemplateExcel")}
                </button>
              </div>
            </div>
          </>
        )}

        {error ? (
          <p className="rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text">{error}</p>
        ) : null}
      </motion.div>
    </AppDialog>
  );
}

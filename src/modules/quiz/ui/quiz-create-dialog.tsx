import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { QuizFormValues } from "@/shared/types";
import { useQuizDetailLoader } from "../model/quiz.queries";
import {
  createDraft,
  draftToFormValues,
  hasDraftContent,
  questionToDraft,
  validateDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import { QuestionEditor } from "./question-editor";
import { QuizPreview } from "./quiz-preview";

export interface AddQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: QuizFormValues) => void;
  courses: Array<{ id: string; title: string }>;
  subjects?: ReadonlyArray<{ value: string; label: string }>;
  showSchedule?: boolean;
  existingQuizzes?: ReadonlyArray<{ id: string; title: string }>;
}

export function AddQuizDialog({
  open,
  onOpenChange,
  onCreate,
  courses,
  subjects,
  showSchedule = false,
  existingQuizzes = [],
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
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const titleComboRef = useRef<HTMLDivElement>(null);
  const loadQuizDetail = useQuizDetailLoader();

  const suggestions = useMemo(() => {
    const query = title.trim().toLowerCase();
    const named = existingQuizzes.filter((quiz) => quiz.title);
    if (!query) return named;
    return named.filter(
      (quiz) => quiz.title.toLowerCase().includes(query) && quiz.title.toLowerCase() !== query
    );
  }, [existingQuizzes, title]);

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

  function newQuestion(type: QuestionDraft["type"] = "single") {
    return createDraft(type, newKey);
  }

  function reset() {
    setStep("details");
    setSelectedCourseId("");
    setSubject("");
    setTitle("");
    setDueAt("");
    setOpensAt("");
    setQuestions([]);
    setCopiedFrom(null);
    setCopyingId(null);
    setError(null);
  }

  function targetError(): string | null {
    if (subjectMode) return subject ? null : t("createDialog.validation.chooseSubject");
    return courseId ? null : t("createDialog.validation.chooseCourse");
  }

  function goToQuestions() {
    const missingTarget = targetError();
    if (missingTarget || !title.trim()) {
      setError(missingTarget ?? t("createDialog.validation.enterTitle"));
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
    if (!title.trim()) return t("createDialog.validation.enterTitle");
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
    onCreate({
      courseId,
      subject: subjectMode ? subject : undefined,
      lessonId: null,
      title: title.trim(),
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
            <span className="quiz-page-eyebrow">{title || t("createDialog.title")}</span>
            <h2>{t("createDialog.questionsPageTitle")}</h2>
          </div>
          <div className="quiz-page-header-actions">
            <Button type="button" variant="ghost" onClick={() => setStep("details")}>
              {t("createDialog.backButton")}
            </Button>
            <Button type="submit" form="quiz-questions-form">
              {t("createDialog.create")}
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

        <div className="quiz-page-split">
          <form id="quiz-questions-form" className="quiz-page-body" onSubmit={submit}>
          {questions.map((question, index) => (
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
          <button type="button" className="quiz-page-add-question" onClick={addQuestion}>
            <Plus size={16} /> {t("createDialog.addQuestion")}
          </button>
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
        title={t("createDialog.title")}
        description={t("createDialog.description")}
      >
        <motion.div
          className="group-action-form"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {subjects ? (
            <SelectPicker
              label={t("createDialog.subjectLabel")}
              icon={BookOpen}
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

          {error ? <div className="form-alert">{error}</div> : null}

          <div className="dialog-actions">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("createDialog.cancel")}
            </Button>
            <Button type="button" onClick={goToQuestions}>
              {t("createDialog.continueButton")}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import type { QuizFormValues } from "@/shared/types";
import { useQuizDetailLoader } from "../model/quiz.queries";
import { QuizPreview } from "./quiz-preview";

interface QuizOptionDraft {
  key: string;
  text: string;
}

interface QuizQuestionDraft {
  key: string;
  text: string;
  points: string;
  options: QuizOptionDraft[];
  correctKey: string | null;
}

export interface AddQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: QuizFormValues) => void;
  courses: Array<{ id: string; title: string }>;
  showSchedule?: boolean;
  existingQuizzes?: ReadonlyArray<{ id: string; title: string }>;
}

const DEFAULT_OPTION_COUNT = 4;

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function emptyOption(key: string): QuizOptionDraft {
  return { key, text: "" };
}

function emptyQuestion(key: string, optionKeys: string[]): QuizQuestionDraft {
  return {
    key,
    text: "",
    points: "1",
    options: optionKeys.map(emptyOption),
    correctKey: null,
  };
}

export function AddQuizDialog({
  open,
  onOpenChange,
  onCreate,
  courses,
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
  const courseId = selectedCourseId || courses[0]?.id || "";
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
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

  function hasDraftContent() {
    return questions.some(
      (question) => question.text.trim() || question.options.some((option) => option.text.trim())
    );
  }

  async function copyFromQuiz(quiz: { id: string; title: string }) {
    setSuggestOpen(false);
    setTitle(quiz.title);
    if (hasDraftContent() && !window.confirm(t("createDialog.copyConfirm", { title: quiz.title }))) {
      return;
    }
    setCopyingId(quiz.id);
    try {
      const detail = await loadQuizDetail(quiz.id);
      setQuestions(
        detail.questions.map((question) => {
          const options = question.options.map((option) => ({ key: newKey(), text: option.text }));
          const correctIndex = question.options.findIndex((option) => option.isCorrect);
          return {
            key: newKey(),
            text: question.text,
            points: String(question.points),
            options,
            correctKey: correctIndex >= 0 ? options[correctIndex].key : null,
          };
        })
      );
      setCopiedFrom(quiz.title);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("createDialog.copyFailed"));
    } finally {
      setCopyingId(null);
    }
  }

  function newQuestion() {
    return emptyQuestion(
      newKey(),
      Array.from({ length: DEFAULT_OPTION_COUNT }, () => newKey())
    );
  }

  function reset() {
    setStep("details");
    setSelectedCourseId("");
    setTitle("");
    setDueAt("");
    setOpensAt("");
    setQuestions([]);
    setCopiedFrom(null);
    setCopyingId(null);
    setError(null);
  }

  function goToQuestions() {
    if (!courseId || !title.trim()) {
      setError(!courseId ? t("createDialog.validation.chooseCourse") : t("createDialog.validation.enterTitle"));
      return;
    }
    setError(null);
    if (!questions.length) setQuestions([newQuestion()]);
    setStep("questions");
  }

  function addQuestion() {
    setQuestions((current) => [...current, newQuestion()]);
  }

  function removeQuestion(questionKey: string) {
    setQuestions((current) => current.filter((question) => question.key !== questionKey));
  }

  function updateQuestion(questionKey: string, patch: Partial<QuizQuestionDraft>) {
    setQuestions((current) =>
      current.map((question) => (question.key === questionKey ? { ...question, ...patch } : question))
    );
  }

  function updateOptionText(questionKey: string, optionKey: string, text: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === questionKey
          ? {
              ...question,
              options: question.options.map((option) =>
                option.key === optionKey ? { ...option, text } : option
              ),
            }
          : question
      )
    );
  }

  function validate(): string | null {
    if (!courseId) return t("createDialog.validation.chooseCourse");
    if (!title.trim()) return t("createDialog.validation.enterTitle");
    if (!questions.length) return t("createDialog.validation.addQuestion");
    for (const question of questions) {
      if (!question.text.trim()) return t("createDialog.validation.questionTextRequired");
      if (question.options.length < 2) return t("createDialog.validation.minTwoOptions");
      if (question.options.some((option) => !option.text.trim()))
        return t("createDialog.validation.allOptionsRequired");
      if (!question.correctKey) return t("createDialog.validation.markCorrect");
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
      lessonId: null,
      title: title.trim(),
      description: "",
      dueAt: dueAt || null,
      opensAt: opensAt || null,
      questions: questions.map((question) => ({
        text: question.text.trim(),
        points: Number(question.points) || 1,
        options: question.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.key === question.correctKey,
        })),
      })),
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
            <div key={question.key} className="quiz-page-question">
              <div className="quiz-page-question-head">
                <span className="quiz-page-question-number">{index + 1}.</span>
                <input
                  className="quiz-page-question-text"
                  value={question.text}
                  onChange={(event) => updateQuestion(question.key, { text: event.target.value })}
                  placeholder={t("createDialog.questionTextPlaceholder")}
                />
                {questions.length > 1 ? (
                  <button
                    type="button"
                    className="quiz-page-question-remove"
                    aria-label={t("createDialog.removeQuestionAria", { number: index + 1 })}
                    onClick={() => removeQuestion(question.key)}
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
              <div className="quiz-page-options">
                {question.options.map((option, optionIndex) => (
                  <div key={option.key} className="quiz-page-option">
                    <span className="quiz-page-option-letter">{optionLetter(optionIndex)})</span>
                    <input
                      value={option.text}
                      onChange={(event) => updateOptionText(question.key, option.key, event.target.value)}
                      placeholder={t("createDialog.optionPlaceholderLettered", {
                        letter: optionLetter(optionIndex),
                      })}
                    />
                  </div>
                ))}
              </div>
              <div
                className="quiz-page-answer-row"
                role="radiogroup"
                aria-label={t("createDialog.correctAnswerGroupAria", { number: index + 1 })}
              >
                <span className="quiz-page-answer-label">{t("createDialog.correctAnswerLabel")}</span>
                {question.options.map((option, optionIndex) => {
                  const active = question.correctKey === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={t("createDialog.markCorrectAria")}
                      className={`quiz-page-answer-letter ${active ? "is-correct" : ""}`}
                      onClick={() => updateQuestion(question.key, { correctKey: option.key })}
                    >
                      {optionLetter(optionIndex)}
                    </button>
                  );
                })}
              </div>
            </div>
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
          {courses.length > 1 ? (
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

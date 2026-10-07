import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Lightbulb,
  ListChecks,
  PencilLine,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toIntlLocale } from "@/shared/i18n";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { FileViewer } from "@/shared/ui/file-viewer";
import { homeworkApi } from "../api/homework.api";
import {
  useRecheckSubmission,
  useReviewSubmission,
  useSubmission,
} from "../model/homework.queries";
import type { AiQuestion, Submission } from "@/shared/types";
import type { ComponentType, ReactNode } from "react";

export interface HomeworkResultDialogProps {
  submissionId?: string | null;
  initial?: Submission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRecheck?: boolean;
  canDownloadFile?: boolean;
  canReview?: boolean;
  title?: string;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function ChipList({ icon: Icon, title, items, tone }: { icon: ComponentType<{ size?: number }>; title: string; items?: unknown[]; tone: string }): ReactNode {
  const values = (items ?? []).map(asText).filter(Boolean);
  if (!values.length) return null;
  return (
    <section className={`hw-summary-card hw-summary-card--${tone}`}>
      <h4>
        <Icon size={16} /> {title}
      </h4>
      <ul>
        {values.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function QuestionCard({
  question,
  index,
  scoreDraft,
  onScoreChange,
}: {
  question: AiQuestion;
  index: number;
  scoreDraft?: string;
  onScoreChange?: (value: string) => void;
}) {
  const { t } = useTranslation("homework");
  const editing = scoreDraft !== undefined;
  const number = question.questionNumber ?? index + 1;
  const mistakes = (question.mistakes ?? []).map(asText).filter(Boolean);
  const suggestions = (question.suggestions ?? []).map(asText).filter(Boolean);
  const categories = (question.errorCategories ?? []).map(asText).filter(Boolean);
  const correct = asText(question.correctAnswer) || asText(question.expectedSolution);

  return (
    <details className="hw-question" open={editing || index === 0}>
      <summary>
        <span className="hw-question-number">{number}</span>
        <span className="hw-question-title">
          {asText(question.question) || t("resultDialog.questionFallback", { number })}
        </span>
        <span className="hw-question-meta">
          {question.difficulty ? <em>{asText(question.difficulty)}</em> : null}
          {question.score !== null && question.score !== undefined ? (
            <strong>
              {question.score} {t("resultDialog.pointsSuffix")}
            </strong>
          ) : null}
        </span>
      </summary>
      <div className="hw-question-body">
        {editing ? (
          <label className="hw-score-field">
            <span>{t("resultDialog.scoreLabel")}</span>
            <input
              inputMode="numeric"
              value={scoreDraft}
              onChange={(event) => onScoreChange?.(event.target.value.replace(/[^\d]/g, ""))}
            />
          </label>
        ) : null}
        {question.studentAnswer ? (
          <p>
            <span className="hw-label">{t("resultDialog.studentAnswer")}</span>
            {asText(question.studentAnswer)}
          </p>
        ) : null}
        {correct ? (
          <p>
            <span className="hw-label">{t("resultDialog.correctAnswer")}</span>
            {correct}
          </p>
        ) : null}
        {question.analysis ? (
          <p>
            <span className="hw-label">{t("resultDialog.analysis")}</span>
            {asText(question.analysis)}
          </p>
        ) : null}
        {mistakes.length ? (
          <div className="hw-question-list hw-question-list--error">
            <span className="hw-label">
              <TriangleAlert size={13} /> {t("resultDialog.mistakes")}
            </span>
            <ul>
              {mistakes.map((item, i) => (
                <li key={`m-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {suggestions.length ? (
          <div className="hw-question-list">
            <span className="hw-label">
              <Lightbulb size={13} /> {t("resultDialog.suggestions")}
            </span>
            <ul>
              {suggestions.map((item, i) => (
                <li key={`s-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {categories.length ? (
          <div className="hw-tag-row">
            {categories.map((item, i) => (
              <span key={`c-${i}`}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export function HomeworkResultDialog({
  submissionId,
  initial = null,
  open,
  onOpenChange,
  canRecheck = false,
  canDownloadFile = false,
  canReview = false,
  title,
}: HomeworkResultDialogProps) {
  const { t, i18n } = useTranslation("homework");
  const dialogTitle = title ?? t("resultDialog.defaultTitle");
  const query = useSubmission(open ? submissionId : null, {
    poll: initial?.status !== "done",
  });
  const recheck = useRecheckSubmission();
  const [fileOpen, setFileOpen] = useState(false);
  const review = useReviewSubmission();
  const submission = query.data ?? initial;

  const [reviewError, setReviewError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    score: string;
    grade: string;
    questions: Record<string, string>;
  } | null>(null);

  function beginEdit() {
    if (!submission) return;
    setDraft({
      score: submission.overallScore == null ? "" : String(submission.overallScore),
      grade: submission.grade ?? "",
      questions: Object.fromEntries(
        (submission.result?.questions ?? []).map((item, index) => [
          String(index),
          item.score == null ? "" : String(item.score),
        ])
      ),
    });
  }

  function buildResult(edited: NonNullable<typeof draft>, score: number | null) {
    const raw = submission?.rawResult;
    if (!raw) return undefined;
    const questions = Array.isArray(raw.questions) ? raw.questions : null;
    return {
      ...raw,
      overall_score: score,
      grade: edited.grade,
      ...(questions
        ? {
            questions: questions.map((item, index) => {
              const value = edited.questions[String(index)];
              if (value === undefined) return item;
              return {
                ...(item as Record<string, unknown>),
                score: value.trim() === "" ? null : Number(value),
              };
            }),
          }
        : {}),
    };
  }

  function saveReview() {
    if (!submission || !draft) return;
    const score = draft.score.trim() === "" ? null : Number(draft.score);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      setReviewError(t("resultDialog.scoreRange"));
      return;
    }
    setReviewError(null);
    review.mutate(
      {
        id: submission.id,
        input: { overallScore: score, grade: draft.grade, result: buildResult(draft, score) },
      },
      {
        onSuccess: () => {
          setDraft(null);
          setReviewError(null);
        },
        onError: (error: Error) => setReviewError(error.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          className="homework-result-dialog"
          title={dialogTitle}
          description={
            submission?.studentName
              ? `${submission.studentName} · ${submission.fileName ?? ""}`
              : t("resultDialog.defaultDescription")
          }
        >
          {!submission ? (
            <div className="hw-result-state">
              <Clock3 size={26} />
              <p>{t("resultDialog.loading")}</p>
            </div>
          ) : (
            <div className="hw-result">
              <header className="hw-result-head">
                {draft ? (
                  <div className="hw-score hw-score--edit">
                    <label className="hw-score-field">
                      <span>{t("resultDialog.overallScore")}</span>
                      <input
                        inputMode="numeric"
                        autoFocus
                        value={draft.score}
                        onChange={(event) =>
                          setDraft({ ...draft, score: event.target.value.replace(/[^\d]/g, "") })
                        }
                      />
                    </label>
                    <label className="hw-score-field">
                      <span>{t("resultDialog.grade")}</span>
                      <input
                        value={draft.grade}
                        onChange={(event) => setDraft({ ...draft, grade: event.target.value })}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="hw-score">
                    <strong>
                      {submission.overallScore ?? "—"}
                      <small>{t("resultDialog.pointsSuffix")}</small>
                    </strong>
                    <span>{submission.grade || t("resultDialog.noGrade")}</span>
                  </div>
                )}
                <div className="hw-result-badges">
                  {submission.isLate ? (
                    <span className="hw-badge hw-badge--warn">
                      <Clock3 size={13} /> {t("resultDialog.lateSubmitted")}
                    </span>
                  ) : null}
                  {submission.checkedAt ? (
                    <span className="hw-badge">
                      <CheckCircle2 size={13} />
                      {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(submission.checkedAt))}
                    </span>
                  ) : null}
                </div>
                <div className="hw-result-actions">
                  {canReview && draft ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>
                        {t("resultDialog.cancel")}
                      </Button>
                      <Button size="sm" loading={review.isPending} onClick={saveReview}>
                        {t("resultDialog.save")}
                      </Button>
                    </>
                  ) : null}
                  {canReview && !draft && submission.status === "done" ? (
                    <Button size="sm" variant="secondary" onClick={beginEdit}>
                      <PencilLine size={15} /> {t("resultDialog.editGrade")}
                    </Button>
                  ) : null}
                  {canDownloadFile ? (
                    <Button size="sm" variant="secondary" onClick={() => setFileOpen(true)}>
                      <Eye size={15} /> {t("resultDialog.viewFile")}
                    </Button>
                  ) : null}
                  {canRecheck ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={recheck.isPending}
                      disabled={submission.status === "checking"}
                      onClick={() => recheck.mutate(submission.id)}
                    >
                      <RefreshCw size={15} /> {t("resultDialog.recheck")}
                    </Button>
                  ) : null}
                </div>
              </header>

              {reviewError ? <div className="form-alert">{reviewError}</div> : null}

              {submission.status === "checking" ? (
                <div className="hw-result-state">
                  <Sparkles size={26} className="spin" />
                  <p>{t("resultDialog.checking")}</p>
                </div>
              ) : null}

              {submission.status === "error" ? (
                <div className="hw-result-state hw-result-state--error">
                  <AlertTriangle size={26} />
                  <p>{submission.error || t("resultDialog.checkError")}</p>
                </div>
              ) : null}

              {submission.result?.summary ? (
                <div className="hw-summary-grid">
                  <ChipList
                    icon={CheckCircle2}
                    tone="good"
                    title={t("resultDialog.strengths")}
                    items={submission.result.summary.strengths}
                  />
                  <ChipList
                    icon={TriangleAlert}
                    tone="warn"
                    title={t("resultDialog.weaknesses")}
                    items={submission.result.summary.weaknesses}
                  />
                  <ChipList
                    icon={ListChecks}
                    tone="info"
                    title={t("resultDialog.topicsToReview")}
                    items={submission.result.summary.topicsToReview}
                  />
                  <ChipList
                    icon={Lightbulb}
                    tone="info"
                    title={t("resultDialog.recommendations")}
                    items={submission.result.summary.recommendations}
                  />
                </div>
              ) : null}

              {submission.result?.questions?.length ? (
                <section className="hw-questions">
                  <span className="dialog-section-label">
                    {t("resultDialog.questionsHeader", { count: submission.result.questions.length })}
                  </span>
                  {submission.result.questions.map((question, index) => (
                    <QuestionCard
                      key={question.questionNumber ?? index}
                      question={question}
                      index={index}
                      scoreDraft={draft?.questions[String(index)]}
                      onScoreChange={(value) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                questions: { ...current.questions, [String(index)]: value },
                              }
                            : current
                        )
                      }
                    />
                  ))}
                </section>
              ) : submission.status === "done" ? (
                <div className="hw-result-state">
                  <ListChecks size={26} />
                  <p>{t("resultDialog.noQuestionDetail")}</p>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      ) : null}

      {submission ? (
        <FileViewer
          open={fileOpen}
          onOpenChange={setFileOpen}
          name={submission.fileName || t("resultDialog.defaultFileName")}
          load={(signal) => homeworkApi.downloadSubmission(submission.id, { signal })}
        />
      ) : null}
    </Dialog>
  );
}

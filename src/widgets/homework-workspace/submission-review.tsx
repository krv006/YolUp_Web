import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useDownloadSubmissionFile,
  useRecheckSubmission,
  useReviewSubmission,
  useSubmission,
} from "@/modules/homework";
import type { Submission } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

export interface SubmissionReviewProps {
  submission: Submission;
  onClose: () => void;
  onStep: (direction: 1 | -1) => void;
}

const SCORES = [2, 3, 4, 5];

export function SubmissionReview({
  submission,
  onClose,
  onStep,
}: SubmissionReviewProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const detail = useSubmission(submission.id);
  const review = useReviewSubmission();
  const recheck = useRecheckSubmission();
  const download = useDownloadSubmissionFile();

  const current = detail.data ?? submission;
  const ai = current.result;
  const aiScore = ai?.overallScore ?? null;

  const [score, setScore] = useState<number | null>(current.overallScore ?? aiScore);
  const [comment, setComment] = useState(current.grade || aiComment(current.result) || "");
  const [shareWithParent, setShareWithParent] = useState(false);

  const [syncedId, setSyncedId] = useState(current.id);

  if (syncedId !== current.id) {
    setSyncedId(current.id);
    setScore(current.overallScore ?? current.result?.overallScore ?? null);
    setComment(current.grade || aiComment(current.result) || "");
  }

  const questions = ai?.questions ?? [];
  const correct = questions.filter((item) => (item.score ?? 0) > 0).length;
  const issues = questions.filter(
    (item) => (item.mistakes?.length ?? 0) > 0 || (item.score ?? 0) <= 0
  );

  function submitted(): string {
    const date = new Date(current.createdAt);
    if (Number.isNaN(date.getTime())) return "—";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return sameDay
      ? `${t("review.today")}, ${time}`
      : `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle lg:hidden"
            onClick={onClose}
            aria-label={t("review.back")}
          >
            <Icon name="arrow-back" size={20} />
          </button>
          <Avatar name={current.studentName} size="lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate font-heading text-h3 text-ink">
              {current.studentName}
            </strong>
            <small className="truncate text-body-sm text-ink-tertiary">
              {submitted()} · {current.isLate ? t("review.late") : t("review.onTime")}
            </small>
          </span>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle"
            onClick={() => onStep(-1)}
            aria-label={t("review.prev")}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-subtle"
            onClick={() => onStep(1)}
            aria-label={t("review.next")}
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-xl bg-subtle">
            <span className="flex flex-col items-center gap-2 text-ink-tertiary">
              <Icon name="assign" size={26} />
              <small className="text-caption">{current.fileName || t("review.noFile")}</small>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <small className="flex-1 truncate text-caption text-ink-tertiary">
              {current.fileName || "—"}
            </small>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
              onClick={() =>
                download.mutate({ id: current.id, fileName: current.fileName || undefined })
              }
              aria-label={t("review.download")}
            >
              <Icon name="download" size={18} />
            </button>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
              onClick={() => recheck.mutate(current.id)}
              aria-label={t("review.recheck")}
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>
        </div>

        {current.error ? (
          <p className="rounded-2xl border border-error-bg bg-error-bg/50 px-4 py-3 text-body-sm text-error-text">
            {current.error}
          </p>
        ) : null}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 border-line bg-surface p-4 lg:w-[400px] lg:border-l lg:p-5">
        <section className="flex flex-col gap-3 rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-saffron-strong text-white">
              <Icon name="check-circle" size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-label-strong text-ink">{t("review.aiTitle")}</strong>
              <small className="text-caption text-ink-tertiary">{t("review.aiHint")}</small>
            </span>
            <span className="flex items-baseline gap-0.5">
              <strong className="font-heading text-h1 text-ink">
                {aiScore === null ? "—" : aiScore}
              </strong>
              <small className="text-caption text-ink-tertiary">/5</small>
            </span>
          </div>

          {questions.length ? (
            <div className="flex flex-col gap-2">
              <span className="flex items-baseline gap-2">
                <small className="flex-1 text-caption text-ink-secondary">
                  {t("review.correctAnswers")}
                </small>
                <small className="font-numeric text-caption-strong text-ink">
                  {correct} / {questions.length}
                </small>
              </span>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <span
                  className="block h-full rounded-full bg-success"
                  style={{ width: `${Math.round((correct / questions.length) * 100)}%` }}
                />
              </span>
            </div>
          ) : null}

          {issues.length ? (
            <div className="flex flex-col gap-2">
              <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">
                {t("review.issues")}
              </small>
              {issues.slice(0, 4).map((item, index) => (
                <span key={index} className="flex items-start gap-2">
                  <Icon
                    name="error"
                    size={15}
                    className="mt-0.5 shrink-0 text-error-text"
                  />
                  <small className="flex-1 text-caption text-ink-secondary">
                    {item.questionNumber ? `${item.questionNumber}. ` : ""}
                    {item.analysis || item.question || t("review.issueFallback")}
                  </small>
                </span>
              ))}
            </div>
          ) : null}

          {aiComment(ai) ? (
            <div className="flex flex-col gap-1.5 rounded-xl bg-subtle p-3">
              <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">
                {t("review.aiDraft")}
              </small>
              <small className="text-caption text-ink-secondary">{aiComment(ai)}</small>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">
            {t("review.yourGrade")}
          </small>
          <div className="grid grid-cols-4 gap-2">
            {SCORES.map((value) => (
              <button
                key={value}
                type="button"
                className={`h-14 rounded-xl border font-heading text-h3 transition-colors ${
                  score === value
                    ? "border-action bg-action text-on-action"
                    : "border-line bg-surface text-ink hover:bg-subtle"
                }`}
                onClick={() => setScore(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {aiScore !== null ? (
            <small className="flex items-center gap-1.5 text-caption text-ink-tertiary">
              <Icon name="check-circle" size={14} className="text-saffron-strong" />
              {t("review.aiSuggestion", {
                value: aiScore,
                state: score === aiScore ? t("review.matches") : t("review.differs"),
              })}
            </small>
          ) : null}

          <label className="field-group">
            <span>{t("review.comment")}</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>

          <span className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-action text-on-action">
              <Icon name="groups" size={17} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-label-strong text-ink">{t("review.shareParent")}</strong>
              <small className="text-caption text-ink-tertiary">
                {t("review.shareParentHint")}
              </small>
            </span>
            <Switch
              checked={shareWithParent}
              onCheckedChange={() => {
                setShareWithParent(false);
                toast.info(t("review.sharePending"));
              }}
              aria-label={t("review.shareParent")}
            />
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
              onClick={() => toast.info(t("review.resubmitPending"))}
            >
              {t("review.resubmit")}
            </button>
            <button
              type="button"
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-50"
              disabled={review.isPending || score === null}
              onClick={() =>
                review.mutate({
                  id: current.id,
                  input: { overallScore: score, grade: comment },
                })
              }
            >
              {t("review.confirm")}
            </button>
          </div>
        </section>
      </aside>
    </section>
  );
}

function aiComment(result: Submission["result"] | null | undefined): string {
  if (!result?.summary) return "";
  const parts = [...(result.summary.recommendations ?? []), ...(result.summary.weaknesses ?? [])];
  return parts
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

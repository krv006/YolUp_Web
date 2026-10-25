import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useAssignment,
  useDownloadSubmissionFile,
  useRequestResubmit,
  useReviewSubmission,
  useSubmission,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { formatDue } from "./format-due";
import { Switch } from "@/shared/ui/switch";
import type { Submission } from "@/shared/types";
import { ResubmitDialog } from "./resubmit-dialog";

const GRADES = [1, 2, 3, 4, 5];

const STATUS_TONE: Record<string, string> = {
  done: "bg-accent-green-bg text-success-fg",
  pending_review: "text-brand",
  checking: "bg-accent-violet-bg text-accent-violet-fg",
  resubmit_requested: "bg-warning-bg text-warning-fg",
  late: "bg-warning-bg text-warning-fg",
};

function statusKey(row: Submission): string {
  if (row.status === "done") return "done";
  if (row.status === "checking") return "checking";
  if (row.isLate) return "late";
  return row.status;
}

export function HomeworkReviewPage() {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { assignmentId = null } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const assignment = useAssignment(assignmentId);
  const review = useReviewSubmission();
  const resubmit = useRequestResubmit();
  const download = useDownloadSubmissionFile();

  const [filter, setFilter] = useState("review");
  const [grade, setGrade] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [shareWithParent, setShareWithParent] = useState(true);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const item = assignment.data ?? null;
  const rows = useMemo(() => item?.submissions ?? [], [item]);
  const visible = filter === "review" ? rows.filter((row) => row.status !== "done") : rows;

  const activeId = params.get("s") ?? visible[0]?.id ?? rows[0]?.id ?? null;
  const submission = useSubmission(activeId);
  const current = submission.data ?? rows.find((row) => row.id === activeId) ?? null;

  if (current && loadedId !== current.id) {
    setLoadedId(current.id);
    setGrade(current.gradeValue ?? null);
    setComment(current.resubmitComment ?? "");
    setShareWithParent(current.shareWithParent);
  }

  const index = rows.findIndex((row) => row.id === activeId);
  const checking = current?.status === "checking";
  const aiScore = current?.overallScore ?? null;
  const aiGrade = aiScore === null ? null : Math.max(1, Math.min(5, Math.round(aiScore / 20)));
  const findings = (current?.result?.questions ?? [])
    .filter((question) => (question.analysis ?? "").length > 0)
    .slice(0, 3);

  function move(step: number) {
    const next = rows[index + step];
    if (next) setParams({ s: next.id });
  }

  function confirm() {
    if (!current) return;
    review
      .mutateAsync({
        id: current.id,
        input: {
          gradeValue: grade,
          grade: grade === null ? "" : String(grade),
          shareWithParent,
        },
      })
      .then(() => move(1));
  }

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      <aside className="flex h-full w-65 shrink-0 flex-col border-r border-line-subtle bg-surface">
        <header className="flex shrink-0 items-start gap-2 px-4 pt-5 pb-3">
          <button
            type="button"
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-subtle"
            aria-label={t("review.back")}
            onClick={() =>
              navigate(assignmentId ? ROUTES.teacher.homeworkItem(assignmentId) : ROUTES.teacher.homework)
            }
          >
            <Icon name="arrow-back" size={20} />
          </button>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="truncate text-title text-ink">{item?.title}</strong>
            <small className="truncate text-body-xs text-ink-tertiary">
              {item?.courseTitle} ·{" "}
              {t("review.submittedCount", {
                submitted: rows.length,
                total: item?.stats?.studentsCount ?? rows.length,
              })}
            </small>
          </span>
        </header>

        <div className="flex shrink-0 items-center gap-2 px-4 pb-3">
          <Chip
            label={t("review.filters.review")}
            count={rows.filter((row) => row.status !== "done").length}
            active={filter === "review"}
            onClick={() => setFilter("review")}
          />
          <Chip
            label={t("review.filters.all")}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {visible.map((row) => {
            const key = statusKey(row);
            const active = row.id === activeId;
            return (
              <button
                key={row.id}
                type="button"
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                onClick={() => setParams({ s: row.id })}
              >
                <Avatar name={row.studentName} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="truncate text-title-sm text-ink">{row.studentName}</strong>
                  <span
                    className={`flex h-5.5 w-fit items-center rounded-full px-2 text-caption-strong ${
                      STATUS_TONE[key] ?? ""
                    }`}
                  >
                    {t(`detail.status.${key}`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-subtle px-6 py-5">
        <header className="flex shrink-0 items-center gap-3 pb-4">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="truncate font-heading text-h1 text-ink">
              {current?.studentName ?? ""}
            </strong>
            <small className="truncate text-body-xs text-ink-tertiary">
              {formatDue(current?.createdAt ?? null, months)}
              {current ? ` · ${current.isLate ? t("review.late") : t("review.onTime")}` : ""}
            </small>
          </span>

          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted disabled:opacity-40"
            disabled={index <= 0}
            aria-label={t("review.prev")}
            onClick={() => move(-1)}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted disabled:opacity-40"
            disabled={index < 0 || index >= rows.length - 1}
            aria-label={t("review.next")}
            onClick={() => move(1)}
          >
            <Icon name="chevron-right" size={20} />
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted disabled:opacity-40"
            disabled={!current}
            aria-label={t("review.download")}
            onClick={() =>
              current && download.mutate({ id: current.id, fileName: current.fileName })
            }
          >
            <Icon name="download" size={20} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg bg-surface p-6">
          {current?.fileName ? (
            <span className="flex flex-col items-center gap-2 text-center">
              <Icon name="image" size={32} className="text-icon-tertiary" />
              <strong className="text-title-sm text-ink">{current.fileName}</strong>
              <small className="text-body-xs text-ink-tertiary">{t("review.openHint")}</small>
            </span>
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("review.noFile")}</p>
          )}
        </div>
      </div>

      <aside className="hidden h-full w-90 shrink-0 flex-col gap-4 overflow-y-auto bg-surface px-5 py-5 xl:flex">
        {checking ? (
          <section className="flex flex-col gap-3 rounded-lg bg-brand-subtle p-4">
            <span className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-accent-violet-fg text-ink-inverse">
                <Icon name="more-horiz" size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-brand-strong">
                  {t("review.aiChecking")}
                </strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {t("review.aiCheckingHint")}
                </small>
              </span>
            </span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <i className="block h-full w-1/2 animate-pulse rounded-full bg-accent-violet-fg" />
            </span>
          </section>
        ) : (
          <section className="flex flex-col gap-3 rounded-lg bg-brand-subtle p-4">
            <span className="flex items-center gap-3">
              <strong className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md bg-brand text-ink-inverse">
                <span className="font-heading text-title-lg">{aiScore ?? "—"}</span>
                <span className="text-micro opacity-80">/100</span>
              </strong>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="flex items-center gap-1.5 truncate text-title-sm text-brand-strong">
                  <Icon name="auto-awesome" size={16} />
                  {t("review.aiSuggestion", { value: aiGrade ?? "—" })}
                </strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {t("review.aiSuggestionHint")}
                </small>
              </span>
            </span>

            {findings.length ? (
              <span className="flex flex-col gap-1.5">
                <strong className="text-title-sm text-ink">{t("review.findings")}</strong>
                {findings.map((question, position) => (
                  <small key={position} className="text-body-xs text-ink-secondary">
                    • {question.analysis}
                  </small>
                ))}
              </span>
            ) : null}
          </section>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-overline text-ink-tertiary uppercase">{t("review.yourGrade")}</span>
          <div className="grid grid-cols-5 gap-2">
            {GRADES.map((value) => (
              <button
                key={value}
                type="button"
                className={`flex h-11 items-center justify-center rounded-md text-title-sm transition-colors ${
                  grade === value
                    ? "bg-brand text-ink-inverse"
                    : "bg-subtle text-ink-secondary hover:text-ink"
                }`}
                onClick={() => setGrade(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {grade !== null && aiGrade === grade ? (
            <small className="flex items-center gap-1.5 text-body-xs text-success-fg">
              <Icon name="check" size={14} />
              {t("review.matchesAi")}
            </small>
          ) : null}
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("review.comment")}</span>
          <textarea
            className="min-h-20 w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body-sm text-ink outline-none focus:border-focus focus:bg-surface"
            value={comment}
            placeholder={t("review.commentPlaceholder")}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        <span className="flex items-center gap-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm text-ink">{t("review.shareParent")}</strong>
            <small className="truncate text-body-xs text-ink-tertiary">
              {t("review.shareParentHint")}
            </small>
          </span>
          <Switch
            checked={shareWithParent}
            onCheckedChange={setShareWithParent}
            aria-label={t("review.shareParent")}
          />
        </span>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle disabled:opacity-40"
            disabled={!current}
            onClick={() => setResubmitOpen(true)}
          >
            {t("review.resubmit")}
          </button>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={!current || review.isPending || grade === null}
            onClick={confirm}
          >
            {t("review.confirm")}
          </button>
        </div>
      </aside>

      <ResubmitDialog
        open={resubmitOpen}
        student={current?.studentName ?? ""}
        pending={resubmit.isPending}
        onOpenChange={setResubmitOpen}
        onConfirm={(value) => {
          if (!current) return;
          resubmit
            .mutateAsync({ id: current.id, comment: value })
            .then(() => setResubmitOpen(false));
        }}
      />
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-7 shrink-0 items-center rounded-full px-3 text-caption-strong transition-colors ${
        active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary hover:text-ink"
      }`}
      onClick={onClick}
    >
      {count === undefined ? label : `${label} · ${count}`}
    </button>
  );
}

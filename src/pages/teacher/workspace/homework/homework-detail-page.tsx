import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAssignment,
  useDeleteAssignment,
  useDownloadAssignmentFile,
  useAssignmentAiSummary,
  useRemindAssignment,
  useUpdateAssignment,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { formatDue } from "./format-due";
import type { Submission, SubmissionStatus } from "@/shared/types";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { AssignmentFormDialog } from "./assignment-form-dialog";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import { RemindDialog } from "./remind-dialog";
import { MobileHomeworkDetail } from "./mobile-homework-detail";
import { useIsCompact } from "@/shared/hooks/use-media-query";

const STATUS_TONE: Record<string, string> = {
  done: "bg-accent-green-bg text-success-fg",
  pending_review: "text-brand",
  checking: "bg-accent-violet-bg text-accent-violet-fg",
  resubmit_requested: "bg-warning-bg text-warning-fg",
  error: "bg-danger-bg text-danger",
  missing: "bg-danger-bg text-danger",
  late: "bg-warning-bg text-warning-fg",
};

function statusKey(row: Submission | null): string {
  if (!row) return "missing";
  if (row.status === "done") return "done";
  if (row.status === "checking") return "checking";
  if (row.isLate) return "late";
  return row.status;
}

export function HomeworkDetailPage() {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { assignmentId = null } = useParams();
  const navigate = useNavigate();
  const assignment = useAssignment(assignmentId);
  const remove = useDeleteAssignment();
  const remind = useRemindAssignment();
  const aiSummary = useAssignmentAiSummary();
  const download = useDownloadAssignmentFile();
  const update = useUpdateAssignment();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const isCompact = useIsCompact();

  const item = assignment.data ?? null;
  const submissions = useMemo(() => item?.submissions ?? [], [item]);

  const total = item?.stats?.studentsCount ?? submissions.length;
  const submitted = submissions.length;
  const summary = aiSummary.data ?? item?.aiGroupSummary ?? null;
  const unchecked = submissions.filter((row) => row.status !== "done").length;
  const missing = Math.max(total - submitted, 0);
  const average = item?.stats?.averageScore ?? null;
  const days = item?.dueAt ? differenceInCalendarDays(new Date(item.dueAt), new Date()) : null;
  const emptyHint =
    days === null || days < 0
      ? t("detail.emptyHintOverdue")
      : days === 0
        ? t("detail.emptyHintToday")
        : t("detail.emptyHint", { count: days });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((row) => {
      if (query && !row.studentName.toLowerCase().includes(query)) return false;
      if (filter === "review") return row.status !== "done";
      return true;
    });
  }, [submissions, search, filter]);

  const dialogs = (
    <>
        {item ? (
          <AssignmentFormDialog
            key={item.id}
            open={editOpen}
            onOpenChange={setEditOpen}
            courses={[
              {
                id: item.courseId,
                title: item.courseTitle,
                studentCount: item.stats?.studentsCount ?? 0,
              },
            ]}
            pending={update.isPending}
            initial={{
              courseId: item.courseId,
              title: item.title,
              body: item.body || item.description,
              dueAt: item.dueAt,
              grading: item.grading,
              announceInChat: item.announceInChat,
              aiCheck: item.aiCheck,
            }}
            onSubmit={(values) =>
              update.mutateAsync({ id: item.id, form: values }).then(() => setEditOpen(false))
            }
          />
        ) : null}

        <DeleteAssignmentDialog
          open={deleteOpen}
          count={submitted}
          pending={remove.isPending}
          onOpenChange={setDeleteOpen}
          onConfirm={() => {
            if (!assignmentId) return;
            remove.mutateAsync(assignmentId).then(() => navigate(ROUTES.teacher.homework));
          }}
        />

        <RemindDialog
          open={remindOpen}
          count={missing}
          title={item?.title ?? ""}
          due={formatDue(item?.dueAt ?? null, months)}
          pending={remind.isPending}
          onOpenChange={setRemindOpen}
          onConfirm={(input) => {
            if (!assignmentId) return;
            remind
              .mutateAsync({
                assignmentId,
                message: input.message,
                notifyParents: input.notifyParents,
              })
              .then(() => setRemindOpen(false));
          }}
        />
    </>
  );

  if (isCompact)
    return (
      <>
        <MobileHomeworkDetail
          item={item}
          eyebrow={t("mobileDetail.eyebrow", {
            course: item?.courseTitle ?? "",
            due: formatDue(item?.dueAt ?? null, months),
          })}
          summary={summary}
          summaryPending={aiSummary.isPending}
          missing={missing}
          emptyHint={emptyHint}
          onBack={() => navigate(-1)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onRemind={() => setRemindOpen(true)}
          onSummary={() => assignmentId && aiSummary.mutate(assignmentId)}
          onOpenSubmission={(row) =>
            assignmentId && navigate(`${ROUTES.teacher.homeworkReview(assignmentId)}?s=${row.id}`)
          }
        />
        {dialogs}
      </>
    );

  return (
    <WorkspaceShell
      eyebrow={t("detail.eyebrow", {
        course: item?.courseTitle ?? "",
        due: formatDue(item?.dueAt ?? null, months),
      })}
      title={item?.title ?? ""}
      action={
        <button
          type="button"
          className={workspaceAction}
          disabled={!missing}
          onClick={() => setRemindOpen(true)}
        >
          {t("detail.remind", { count: missing })}
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col rounded-lg bg-surface p-5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="flex h-[22px] items-center gap-1 rounded-full bg-warning-bg px-2 text-caption-strong text-ink">
                <Icon name="timer" size={13} />
                {days !== null && days >= 0
                  ? t("list.daysLeft", { count: days })
                  : t("detail.due", { value: formatDue(item?.dueAt ?? null, months) })}
              </span>
              <span className="flex h-[22px] items-center rounded-full bg-accent-violet-bg px-2 text-caption-strong text-accent-violet-fg">
                {t("detail.aiCheck")}
              </span>
            </span>

            <p className="mt-3 text-body-sm text-ink">{item?.body || item?.description}</p>

            {item?.hasAttachment ? (
              <button
                type="button"
                className="mt-3 flex h-[52px] items-center gap-3 rounded-xl bg-subtle px-3 text-left transition-colors hover:bg-muted"
                onClick={() =>
                  assignmentId &&
                  download.mutate({ id: assignmentId, fileName: item.attachmentName })
                }
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-danger">
                  <Icon name="description-fill" size={18} />
                </span>
                <strong className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">
                  {item.attachmentName}
                </strong>
                <Icon name="download" size={18} className="shrink-0 text-icon-tertiary" />
              </button>
            ) : null}

            <dl className="mt-[15px] flex flex-col gap-3">
              <Meta label={t("detail.grading")} value={t(`form.gradings.${item?.grading ?? "five"}`)} />
              <Meta
                label={t("detail.allowLate")}
                value={item?.allowLate ? t("detail.allowed") : t("detail.notAllowed")}
              />
              {item?.lessonTitle ? (
                <Meta label={t("detail.lesson")} value={item.lessonTitle} />
              ) : null}
            </dl>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex h-10 items-center justify-center rounded-full border border-line-strong bg-surface text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
                onClick={() => setEditOpen(true)}
              >
                {t("detail.edit")}
              </button>
              <button
                type="button"
                className="flex h-10 items-center justify-center rounded-full bg-danger-bg text-body-sm font-semibold text-danger transition-opacity hover:opacity-85"
                onClick={() => setDeleteOpen(true)}
              >
                {t("detail.delete")}
              </button>
            </div>
          </section>

          {submitted ? (
          <section className="flex flex-col gap-3 rounded-lg bg-brand-subtle p-5">
            <strong className="flex items-center gap-2 text-title-sm text-brand-strong">
              <Icon name="auto-awesome" size={18} />
              {t("detail.aiAdvice")}
            </strong>

            {summary ? (
              <>
                <p className="text-body-sm text-ink">{summary.text || summary.summary}</p>

                {summary.recommendations.length ? (
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-body-xs text-ink-secondary">
                    {summary.recommendations.slice(0, 3).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-body-xs text-ink-secondary">{t("detail.aiAdviceHint")}</p>
            )}

            <button
              type="button"
              className="flex h-10 w-full items-center justify-center rounded-full bg-surface text-button text-brand transition-colors hover:bg-tint disabled:opacity-50"
              disabled={aiSummary.isPending || !submitted}
              onClick={() => assignmentId && aiSummary.mutate(assignmentId)}
            >
              {summary ? t("detail.aiRefresh") : t("detail.aiGenerate")}
            </button>
          </section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label={t("detail.stats.submitted")} value={`${submitted} / ${total}`} />
            <StatCard
              label={t("detail.stats.unchecked")}
              value={String(unchecked)}
              tone="text-brand-strong"
            />
            <StatCard
              label={t("detail.stats.missing")}
              value={String(missing)}
              tone="text-danger"
            />
            <StatCard
              label={t("detail.stats.average")}
              value={average === null ? "—" : average.toFixed(1).replace(".", ",")}
              tone="text-success-fg"
            />
          </div>

          {submitted ? (
          <section className="flex min-w-0 flex-col gap-4 rounded-lg bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md bg-subtle px-4">
                <Icon name="search" size={18} className="shrink-0 text-icon-tertiary" />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
                  value={search}
                  placeholder={t("detail.searchStudent")}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <Chip
                label={t("detail.filters.all")}
                count={submissions.length}
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              <Chip
                label={t("detail.filters.review")}
                count={unchecked}
                active={filter === "review"}
                onClick={() => setFilter("review")}
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="grid grid-cols-[minmax(0,1fr)_120px_140px_64px_64px_32px] items-center gap-3 border-b border-line-subtle pb-3">
                {["student", "submitted", "status", "ai", "grade"].map((column) => (
                  <small key={column} className="truncate text-body-xs text-ink-secondary">
                    {t(`detail.columns.${column}`)}
                  </small>
                ))}
                <span />
              </div>

              {rows.map((row) => {
                const key = statusKey(row);
                return (
                  <button
                    key={row.id}
                    type="button"
                    className="grid grid-cols-[minmax(0,1fr)_120px_140px_64px_64px_32px] items-center gap-3 border-b border-line-subtle py-3.5 text-left transition-colors last:border-b-0 hover:bg-subtle"
                    onClick={() =>
                      assignmentId &&
                      navigate(`${ROUTES.teacher.homeworkReview(assignmentId)}?s=${row.id}`)
                    }
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={row.studentName} size="sm" />
                      <span className="min-w-0 truncate text-body text-ink">{row.studentName}</span>
                    </span>

                    <small className="truncate text-body-sm text-ink-secondary">
                      {formatDue(row.createdAt, months)}
                    </small>

                    <span
                      className={`flex h-6.5 w-fit items-center rounded-full px-2.5 text-caption-strong ${
                        STATUS_TONE[key] ?? ""
                      }`}
                    >
                      {t(`detail.status.${key}`)}
                    </span>

                    <small className="text-body-sm text-ink-secondary">
                      {row.overallScore === null ? "—" : row.overallScore}
                    </small>

                    <small
                      className={`text-title-sm ${
                        row.gradeValue === null ? "text-ink-tertiary" : "text-success-fg"
                      }`}
                    >
                      {row.gradeValue === null ? "—" : row.gradeValue}
                    </small>

                    <Icon name="chevron-right" size={18} className="text-icon-tertiary" />
                  </button>
                );
              })}

              {!rows.length ? (
                <p className="py-8 text-center text-body-sm text-ink-tertiary">
                  {t("detail.noStudents")}
                </p>
              ) : null}
            </div>
          </section>
          ) : (
            <MobileEmptyCard
              icon="assignment"
              title={t("detail.emptyTitle")}
              description={emptyHint}
              descriptionClassName="max-w-[310px]"
            />
          )}
        </div>
      </div>

      {dialogs}
    </WorkspaceShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex h-[18px] items-center gap-3">
      <dt className="min-w-0 flex-1 truncate text-body-xs text-ink-secondary">{label}</dt>
      <dd className="shrink-0 text-body-xs font-semibold text-ink">{value}</dd>
    </span>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-label transition-colors ${
        active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary hover:text-ink"
      }`}
      onClick={onClick}
    >
      {label} · {count}
    </button>
  );
}

function StatCard({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
    </div>
  );
}

export type { SubmissionStatus };

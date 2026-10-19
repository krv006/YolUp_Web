import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourses, useCourseStudents } from "@/modules/course";
import { homeworkApi, homeworkKeys, useAssignments, useDeleteAssignment } from "@/modules/homework";
import type { Assignment, Submission } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { AssignmentFormDialog } from "./assignment-form-dialog";
import { SubmissionReview } from "./submission-review";

export interface HomeworkWorkspaceProps {
  courseId?: string | null;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}

type ListFilter = "active" | "review" | "done" | "draft";
type RowFilter = "all" | "unchecked" | "graded" | "missing";

interface StudentRow {
  id: string;
  name: string;
  avatarTone?: string;
  submission: Submission | null;
}

export function HomeworkWorkspace({
  courseId = null,
  createOpen = false,
  onCreateOpenChange,
}: HomeworkWorkspaceProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const scoped = useAssignments(courseId, Boolean(courseId));
  const courses = useCourses();
  const perCourse = useQueries({
    queries: (courseId ? [] : (courses.data ?? [])).map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const assignments = courseId
    ? { data: scoped.data, isLoading: scoped.isLoading }
    : {
        data: perCourse.flatMap((query) => query.data ?? []),
        isLoading: courses.isLoading || perCourse.some((query) => query.isLoading),
      };
  const remove = useDeleteAssignment();

  const [filter, setFilter] = useState<ListFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const items = useMemo(() => assignments.data ?? [], [assignments.data]);
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const students = useCourseStudents(selected?.courseId ?? null, { page_size: 100 });

  const [now] = useState(() => Date.now());

  const rows: StudentRow[] = useMemo(() => {
    if (!selected) return [];
    const byStudent = new Map(selected.submissions.map((item) => [item.studentId, item]));
    const list = (students.data?.items ?? []).map((item) => ({
      id: item.student.id,
      name: item.student.name,
      avatarTone: item.student.avatarTone,
      submission: byStudent.get(item.student.id) ?? null,
    }));
    if (list.length) return list;
    return selected.submissions.map((item) => ({
      id: item.studentId,
      name: item.studentName,
      submission: item,
    }));
  }, [selected, students.data]);

  const submitted = rows.filter((row) => row.submission).length;
  const graded = rows.filter((row) => row.submission?.grade).length;
  const unchecked = submitted - graded;
  const missing = rows.length - submitted;
  const scores = rows
    .map((row) => row.submission?.overallScore)
    .filter((value): value is number => typeof value === "number");
  const average = scores.length
    ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)
    : "—";

  const visibleRows = rows.filter((row) => {
    if (search && !row.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (rowFilter === "unchecked") return Boolean(row.submission) && !row.submission?.grade;
    if (rowFilter === "graded") return Boolean(row.submission?.grade);
    if (rowFilter === "missing") return !row.submission;
    return true;
  });

  const listItems = items.filter((item) => {
    const due = item.dueAt ? new Date(item.dueAt).getTime() : null;
    const open = due === null || due >= now;
    if (filter === "active") return open;
    if (filter === "review") return item.submissions.some((entry) => !entry.grade);
    if (filter === "done") return !open;
    return false;
  });

  const thisWeek = listItems.filter((item) => withinWeek(item.createdAt));
  const earlier = listItems.filter((item) => !withinWeek(item.createdAt));

  function formatDue(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  const reviewSubmission = reviewId
    ? (selected?.submissions.find((item) => item.id === reviewId) ?? null)
    : null;

  if (!assignments.isLoading && !items.length)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-action text-on-action">
          <Icon name="assign" size={26} />
        </span>
        <strong className="font-heading text-h3 text-ink">{t("workspace.emptyTitle")}</strong>
        <p className="max-w-[420px] text-body-sm text-ink-secondary">
          {t("workspace.emptyDescription")}
        </p>
        <button
          type="button"
          className="mt-1 flex h-12 items-center gap-2 rounded-full bg-action px-6 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => onCreateOpenChange?.(true)}
        >
          {t("workspace.emptyAction")}
        </button>
        <AssignmentFormDialog
          open={createOpen}
          onOpenChange={(open) => onCreateOpenChange?.(open)}
          courseId={courseId}
        />
      </div>
    );

  if (reviewSubmission && selected)
    return (
      <div className="flex h-full min-h-0 overflow-hidden bg-canvas">
        <aside className="hidden w-[340px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-line bg-surface p-4 lg:flex">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
              onClick={() => setReviewId(null)}
              aria-label={t("review.back")}
            >
              <Icon name="arrow-back" size={19} />
            </button>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-label-strong text-ink">{selected.title}</strong>
              <small className="truncate text-caption text-ink-tertiary">
                {selected.courseTitle} ·{" "}
                {t("workspace.submittedOf", { done: submitted, total: rows.length })}
              </small>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["unchecked", t("workspace.rowUnchecked", { count: unchecked })],
                ["all", t("workspace.rowAll", { count: rows.length })],
                ["graded", t("workspace.rowGraded", { count: graded })],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`h-9 rounded-full px-3 text-label-strong transition-colors ${
                  rowFilter === id
                    ? "bg-action-subtle text-action"
                    : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
                }`}
                onClick={() => setRowFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-line">
            {visibleRows
              .filter((row) => row.submission)
              .map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`flex items-center gap-3 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                    row.submission?.id === reviewSubmission.id
                      ? "bg-action-subtle/50"
                      : "hover:bg-subtle"
                  }`}
                  onClick={() => row.submission && setReviewId(row.submission.id)}
                >
                  <Avatar name={row.name} tone={row.avatarTone} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-label-strong text-ink">{row.name}</strong>
                    <small className="truncate text-caption text-ink-tertiary">
                      {formatDue(row.submission?.createdAt ?? null)}
                    </small>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-caption-strong ${
                      row.submission?.grade
                        ? "bg-success-bg text-success-text"
                        : "bg-action-subtle text-action"
                    }`}
                  >
                    {row.submission?.result?.overallScore != null
                      ? `AI: ${row.submission.result.overallScore}`
                      : "—"}
                  </span>
                </button>
              ))}
          </div>
        </aside>

        <SubmissionReview
          submission={reviewSubmission}
          onClose={() => setReviewId(null)}
          onStep={(direction) => {
            const all = selected.submissions;
            const index = all.findIndex((item) => item.id === reviewSubmission.id);
            const next = all[(index + direction + all.length) % all.length];
            if (next) setReviewId(next.id);
          }}
        />
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-line bg-canvas p-4 lg:w-[380px] lg:border-r lg:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["active", t("workspace.filterActive", { count: items.length })],
              ["review", t("workspace.filterReview", { count: unchecked })],
              ["done", t("workspace.filterDone")],
              ["draft", t("workspace.filterDraft")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`h-9 rounded-full px-3.5 text-label-strong transition-colors ${
                filter === id
                  ? "bg-action-subtle text-action"
                  : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
              }`}
              onClick={() => {
                if (id === "draft") {
                  toast.info(t("workspace.draftPending"));
                  return;
                }
                setFilter(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {assignments.isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))
          : null}

        {[
          [t("workspace.thisWeek"), thisWeek],
          [t("workspace.earlier"), earlier],
        ].map(([label, group]) =>
          (group as Assignment[]).length ? (
            <section key={label as string} className="flex flex-col gap-2">
              <small className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
                {label as string}
              </small>
              {(group as Assignment[]).map((item) => {
                const total = item.stats?.studentsCount ?? null;
                const done = item.stats?.submittedCount ?? item.submissions.length;
                const progress = total ? Math.round((done / total) * 100) : 0;
                const active = item.id === selected?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? "border-action bg-action-subtle/40"
                        : "border-line bg-surface hover:bg-subtle"
                    }`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setRowFilter("all");
                    }}
                  >
                    <span className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action-subtle text-action">
                        <Icon name="assign" size={18} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <small className="text-caption text-ink-tertiary">
                          {t("chatCard.label")}
                        </small>
                        <strong className="truncate text-label-strong text-ink">
                          {item.courseTitle}
                        </strong>
                      </span>
                      <small className="shrink-0 text-caption-strong text-action">
                        {total
                          ? t("workspace.submittedOf", { done, total })
                          : t("workspace.submittedCount", { count: done })}
                      </small>
                    </span>

                    <strong className="font-heading text-title text-ink">{item.title}</strong>
                    {item.description ? (
                      <p className="line-clamp-2 text-body-sm text-ink-secondary">
                        {item.description}
                      </p>
                    ) : null}

                    <span className="flex items-center gap-3 text-caption text-ink-tertiary">
                      <span className="flex items-center gap-1.5">
                        <Icon name="clock" size={14} /> {formatDue(item.dueAt)}
                      </span>
                      {item.hasAttachment ? (
                        <span className="flex items-center gap-1.5">
                          <Icon name="assign" size={14} /> {t("chatCard.fileCount", { count: 1 })}
                        </span>
                      ) : null}
                    </span>

                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <span
                        className="block h-full rounded-full bg-success"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </section>
          ) : null
        )}
      </aside>

      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        {selected ? (
          <>
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="truncate font-heading text-h2 text-ink">{selected.title}</h2>
                <small className="truncate text-body-sm text-ink-tertiary">
                  {selected.courseTitle} · {t("workspace.dueLabel", { value: formatDue(selected.dueAt) })}
                  {selected.hasAttachment ? ` · ${t("chatCard.fileCount", { count: 1 })}` : ""}
                </small>
              </span>
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
                onClick={() => toast.info(t("workspace.remindPending"))}
              >
                <Icon name="bell" size={17} /> {t("workspace.remind", { count: missing })}
              </button>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
                onClick={() => setEditing(selected)}
                aria-label={t("workspace.edit")}
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
                onClick={() => setDeleteTarget(selected)}
                aria-label={t("workspace.delete")}
              >
                <Icon name="more" size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(
                [
                  ["check-circle", "bg-success", `${submitted} / ${rows.length}`, t("workspace.statSubmitted")],
                  ["assign", "bg-saffron-strong", String(unchecked), t("workspace.statUnchecked")],
                  ["clock", "bg-error", String(missing), t("workspace.statMissing")],
                  ["check-circle", "bg-saffron-strong", average, t("workspace.statAverage")],
                ] as const
              ).map(([icon, tone, value, label], index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4"
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${tone} text-white`}>
                    <Icon name={icon} size={17} />
                  </span>
                  <strong className="font-heading text-h2 text-ink">{value}</strong>
                  <small className="text-caption text-ink-secondary">{label}</small>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-saffron-subtle p-4">
              <span className="flex items-center gap-2">
                <Icon name="check-circle" size={17} className="shrink-0 text-saffron-strong" />
                <strong className="flex-1 text-label-strong text-ink">
                  {t("workspace.aiSummary")}
                </strong>
                <button
                  type="button"
                  className="text-label-strong text-action"
                  onClick={() => toast.info(t("workspace.aiPending"))}
                >
                  {t("workspace.aiAction")}
                </button>
              </span>
              <p className="text-body-sm text-ink-secondary">
                {summaryText(selected) || t("workspace.aiEmpty")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["all", t("workspace.rowAll", { count: rows.length })],
                  ["unchecked", t("workspace.rowUnchecked", { count: unchecked })],
                  ["graded", t("workspace.rowGraded", { count: graded })],
                  ["missing", t("workspace.rowMissing", { count: missing })],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-9 rounded-full px-3.5 text-label-strong transition-colors ${
                    rowFilter === id
                      ? "bg-action-subtle text-action"
                      : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
                  }`}
                  onClick={() => setRowFilter(id)}
                >
                  {label}
                </button>
              ))}
              <label className="ml-auto flex h-11 min-w-[220px] items-center gap-2.5 rounded-full border border-line bg-surface px-4">
                <Icon name="search" size={17} className="shrink-0 text-ink-tertiary" />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("workspace.searchStudent")}
                />
              </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex items-center gap-3 border-b border-line bg-subtle px-4 py-3 text-caption-strong tracking-wide text-ink-tertiary uppercase">
                <span className="min-w-0 flex-1">{t("workspace.colStudent")}</span>
                <span className="hidden w-32 shrink-0 lg:block">{t("workspace.colSubmitted")}</span>
                <span className="w-28 shrink-0">{t("workspace.colStatus")}</span>
                <span className="hidden w-20 shrink-0 text-center lg:block">
                  {t("workspace.colAi")}
                </span>
                <span className="w-16 shrink-0 text-center">{t("workspace.colGrade")}</span>
                <span className="w-6 shrink-0" />
              </div>

              {visibleRows.map((row) => {
                const state = row.submission
                  ? row.submission.grade
                    ? "graded"
                    : row.submission.isLate
                      ? "late"
                      : "unchecked"
                  : "missing";
                return (
                  <button
                    key={row.id}
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle"
                    onClick={() => row.submission && setReviewId(row.submission.id)}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={row.name} tone={row.avatarTone} size="sm" />
                      <span className="truncate text-body-sm text-ink">{row.name}</span>
                    </span>
                    <span className="hidden w-32 shrink-0 text-caption text-ink-tertiary lg:block">
                      {row.submission ? formatDue(row.submission.createdAt) : "—"}
                    </span>
                    <span className="w-28 shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-caption-strong ${
                          state === "graded"
                            ? "bg-success-bg text-success-text"
                            : state === "late"
                              ? "bg-error-bg text-error-text"
                              : state === "unchecked"
                                ? "bg-saffron-subtle text-saffron-strong"
                                : "bg-error-bg text-error-text"
                        }`}
                      >
                        {t(`workspace.state.${state}`)}
                      </span>
                    </span>
                    <span className="hidden w-20 shrink-0 text-center font-numeric text-body-sm text-action lg:block">
                      {row.submission?.result?.overallScore ?? "—"}
                    </span>
                    <span className="w-16 shrink-0 text-center font-numeric text-body-sm text-ink">
                      {row.submission?.grade ? (row.submission.overallScore ?? "—") : "—"}
                    </span>
                    <Icon name="chevron-right" size={18} className="shrink-0 text-ink-tertiary" />
                  </button>
                );
              })}

              {!visibleRows.length ? (
                <p className="px-4 py-10 text-center text-body-sm text-ink-tertiary">
                  {t("workspace.noStudents")}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <AssignmentFormDialog
        open={createOpen || Boolean(editing)}
        onOpenChange={(open) => {
          if (open) return;
          onCreateOpenChange?.(false);
          setEditing(null);
        }}
        courseId={courseId}
        assignment={editing}
      />

      <AppDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        variant="confirm"
        icon={
          <span className="grid size-11 place-items-center rounded-full bg-error-bg text-error-text">
            <Icon name="trash" size={20} />
          </span>
        }
        title={t("workspace.deleteTitle")}
        description={t("workspace.deleteDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setDeleteTarget(null)}
            >
              {t("workspace.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={remove.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                remove.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    setDeleteTarget(null);
                    setSelectedId(null);
                  },
                });
              }}
            >
              {t("workspace.delete")}
            </button>
          </>
        }
      />
    </div>
  );
}

function withinWeek(value: string): boolean {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return false;
  return Date.now() - date < 7 * 24 * 60 * 60 * 1000;
}

function summaryText(assignment: Assignment): string {
  const parts = assignment.submissions
    .map((item) => item.result?.summary?.recommendations ?? [])
    .flat()
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);
  return [...new Set(parts)].slice(0, 2).join(" ");
}

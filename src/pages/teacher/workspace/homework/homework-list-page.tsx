import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCourses } from "@/modules/course";
import {
  homeworkApi,
  homeworkKeys,
  useCreateAssignment,
  useHomeworkAiStats,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import type { Assignment } from "@/shared/types";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { formatDue } from "./format-due";
import { AssignmentFormDialog } from "./assignment-form-dialog";

function dueInDays(value: string | null): number | null {
  if (!value) return null;
  const due = new Date(value).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / 86_400_000);
}

export function HomeworkListPage() {
  const { t } = useTranslation("homework");
  const navigate = useNavigate();
  const courses = useCourses();
  const create = useCreateAssignment();
  const aiStats = useHomeworkAiStats("today");
  const [filter, setFilter] = useState("active");
  const [createOpen, setCreateOpen] = useState(false);

  const groups = useMemo(() => courses.data ?? [], [courses.data]);

  const queries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        homeworkApi.getAssignments(course.id, { signal }),
    })),
  });

  const items = useMemo(() => queries.flatMap((query) => query.data ?? []), [queries]);
  const loading = queries.some((query) => query.isLoading);

  const toReview = items.reduce((sum, item) => {
    const submitted = item.stats?.submittedCount ?? 0;
    const checked = item.submissions?.filter((row) => row.status === "done").length ?? 0;
    return sum + Math.max(submitted - checked, 0);
  }, 0);

  const active = items.filter((item) => item.status === "active");
  const drafts = items.filter((item) => item.status === "draft");

  const visible =
    filter === "draft" ? drafts : filter === "review" ? active.filter(needsReview) : active;

  const [thisWeek, earlier] = useMemo(() => {
    const week: Assignment[] = [];
    const past: Assignment[] = [];
    for (const item of visible) {
      const days = dueInDays(item.dueAt);
      if (days !== null && days >= 0 && days <= 7) week.push(item);
      else past.push(item);
    }
    return [week, past];
  }, [visible]);

  const submittedTotal = items.reduce((sum, item) => sum + (item.stats?.submittedCount ?? 0), 0);
  const expectedTotal = items.reduce((sum, item) => sum + (item.stats?.studentsCount ?? 0), 0);
  const submitRate = expectedTotal ? Math.round((submittedTotal / expectedTotal) * 100) : null;
  const scores = items
    .map((item) => item.stats?.averageScore ?? null)
    .filter((value): value is number => value !== null);
  const averageScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : null;

  return (
    <WorkspaceShell
      eyebrow={t("list.eyebrow", { count: groups.length })}
      title={t("list.title")}
      action={
        <button type="button" className={workspaceAction} onClick={() => setCreateOpen(true)}>
          {t("list.create")}
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_376px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Tab
              label={t("list.filters.active")}
              count={active.length}
              active={filter === "active"}
              onClick={() => setFilter("active")}
            />
            <Tab
              label={t("list.filters.review")}
              count={active.filter(needsReview).length}
              active={filter === "review"}
              onClick={() => setFilter("review")}
            />
            <Tab
              label={t("list.filters.draft")}
              count={drafts.length}
              active={filter === "draft"}
              onClick={() => setFilter("draft")}
            />
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-30 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : null}

          {[
            { id: "week", rows: thisWeek },
            { id: "earlier", rows: earlier },
          ].map((section) =>
            section.rows.length ? (
              <section key={section.id} className="flex flex-col gap-3">
                <span className="text-overline text-ink-tertiary uppercase">
                  {t(`list.sections.${section.id}`)}
                </span>

                {section.rows.map((item) => (
                  <AssignmentCard
                    key={item.id}
                    item={item}
                    onOpen={() => navigate(ROUTES.teacher.homeworkItem(item.id))}
                  />
                ))}
              </section>
            ) : null
          )}

          {!loading && !visible.length ? (
            <p className="rounded-lg bg-surface px-5 py-10 text-center text-body-sm text-ink-tertiary">
              {t("list.empty")}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("list.stats.active")} value={String(active.length)} />
            <StatCard
              label={t("list.stats.review")}
              value={String(toReview)}
              tone="text-brand-strong"
            />
            <StatCard
              label={t("list.stats.submitRate")}
              value={submitRate === null ? "—" : `${submitRate}%`}
            />
            <StatCard
              label={t("list.stats.average")}
              value={averageScore === null ? "—" : averageScore.toFixed(1).replace(".", ",")}
              tone="text-success-fg"
            />
          </div>

          <section className="flex flex-col gap-2 rounded-lg bg-brand-subtle p-5">
            <strong className="flex items-center gap-2 text-title-sm text-brand-strong">
              <Icon name="auto-awesome" size={18} />
              {aiStats.data?.checked
                ? t("list.aiCheckedToday", { count: aiStats.data.checked })
                : t("list.aiTitle")}
            </strong>
            <p className="text-body-xs text-ink-secondary">
              {aiStats.data?.pendingConfirm
                ? t("list.aiPendingConfirm", { count: aiStats.data.pendingConfirm })
                : t("list.aiHint")}
            </p>
          </section>
        </div>
      </div>

      <AssignmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        courses={groups.map((course) => ({
          id: course.id,
          title: course.title,
          studentCount: course.studentCount ?? 0,
        }))}
        pending={create.isPending}
        onSubmit={(values) =>
          create.mutateAsync(values).then(() => setCreateOpen(false))
        }
      />
    </WorkspaceShell>
  );
}

function needsReview(item: Assignment): boolean {
  const submitted = item.stats?.submittedCount ?? 0;
  const checked = item.submissions?.filter((row) => row.status === "done").length ?? 0;
  return submitted > checked;
}

function AssignmentCard({ item, onOpen }: { item: Assignment; onOpen: () => void }) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const days = dueInDays(item.dueAt);
  const submitted = item.stats?.submittedCount ?? 0;
  const total = item.stats?.studentsCount ?? 0;
  const pending = item.submissions?.filter((row) => row.status !== "done").length ?? 0;
  const percent = total ? Math.round((submitted / total) * 100) : 0;

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-surface p-5">
      <div className="flex items-start gap-3">
        <GroupTile name={item.courseTitle} className="size-9 rounded-md text-caption-strong" />

        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
          onClick={onOpen}
        >
          <strong className="w-full truncate text-title-lg text-ink">{item.title}</strong>
          <small className="w-full truncate text-body-xs text-ink-tertiary">
            {item.courseTitle}
            {item.dueAt ? ` · ${t("list.due", { value: formatDue(item.dueAt, months) })}` : ""}
          </small>
        </button>

        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink"
          aria-label={t("list.open")}
          onClick={onOpen}
        >
          <Icon name="more" size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {pending ? (
          <span className="flex h-6.5 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 text-caption-strong text-brand">
            <Icon name="fact-check" size={13} />
            {t("list.reviewChip", { count: pending })}
          </span>
        ) : days !== null && days >= 0 ? (
          <span className="flex h-6.5 shrink-0 items-center gap-1.5 rounded-full bg-warning-bg px-2.5 text-caption-strong text-warning-fg">
            <Icon name="schedule" size={13} />
            {t("list.daysLeft", { count: days })}
          </span>
        ) : null}

        <small className="min-w-0 flex-1 truncate text-right text-body-xs text-ink-tertiary">
          {t("list.submitted", { submitted, total })}
        </small>
      </div>

      <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <i className="block h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </span>
    </article>
  );
}

function Tab({
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
      className={`flex h-11 items-center justify-center rounded-full text-button transition-colors ${
        active ? "bg-brand text-ink-inverse" : "bg-surface text-ink-secondary hover:text-ink"
      }`}
      onClick={onClick}
    >
      {count ? `${label} · ${count}` : label}
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

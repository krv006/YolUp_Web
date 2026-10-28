import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { Assignment } from "@/shared/types";
import { MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { TaskCards } from "@/widgets/group-workspace";
import { useAssignmentRows } from "@/widgets/student-group-workspace";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { FilterChips } from "./filter-chips";
import { useStudentWorkspace } from "./use-student-workspace";

type Filter = "all" | "open" | "checking" | "graded";

const FILTERS: Filter[] = ["all", "open", "checking", "graded"];

function stateOf(item: Assignment): Exclude<Filter, "all"> {
  if (!item.mySubmission) return "open";
  return item.mySubmission.status === "done" ? "graded" : "checking";
}

export function StudentHomeworkPage() {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const data = useStudentWorkspace();
  const toRow = useAssignmentRows();
  const [filter, setFilter] = useState<Filter>("all");

  const items = [...data.assignments].sort((a, b) => {
    const open = Number(Boolean(a.mySubmission)) - Number(Boolean(b.mySubmission));
    return open || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
  });
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, item) => ({ ...acc, [item]: item === "all" ? items.length : items.filter((row) => stateOf(row) === item).length }),
    { all: 0, open: 0, checking: 0, graded: 0 }
  );
  const chips = FILTERS.map((item) => ({ id: item, label: `${t(`workspace.homework.filters.${item}`)} · ${counts[item]}` }));
  const visible = items.filter((item) => filter === "all" || stateOf(item) === filter);
  const sections = data.courses
    .map((course) => ({ course, rows: visible.filter((item) => item.courseId === course.id) }))
    .filter((section) => section.rows.length);

  const content = data.assignmentsLoading ? (
    <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <i key={index} className="h-28 rounded-xl bg-surface" />
      ))}
    </div>
  ) : sections.length ? (
    sections.map(({ course, rows }) => (
      <section key={course.id} className="flex flex-col gap-3">
        <span className="text-overline text-ink-secondary uppercase">{course.title}</span>
        <TaskCards
          rows={rows.map(toRow)}
          courseTitle={course.title}
          courseImage={course.avatarUrl}
          courseTone={course.color}
          className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3.5"
        />
      </section>
    ))
  ) : (
    <MobileEmptyCard icon="assign" title={t("workspace.homework.emptyTitle")} description={t("workspace.homework.emptyHint")} />
  );

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={t("workspace.homework.title")}
          backLabel={t("workspace.back")}
          onBack={() => navigate(ROUTES.student.workspace)}
        />
        <FilterChips compact items={chips} value={filter} onChange={setFilter} />
        {content}
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("workspace.homework.eyebrow", { count: items.length })} title={t("workspace.homework.title")}>
      <FilterChips items={chips} value={filter} onChange={setFilter} />
      {content}
    </WorkspaceShell>
  );
}

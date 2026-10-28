import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { startOfWeek } from "date-fns";
import { useAttendance } from "@/modules/attendance";
import { useLessons } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { monthAttendanceRate } from "../lib/attendance-rate";
import { useStudentWorkspace } from "./use-student-workspace";

const WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;
const CHART_HEIGHT = 220;

function decimal(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export function StudentAnalyticsPage() {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const data = useStudentWorkspace();
  const { now } = data;
  const lessons = useLessons({ page_size: 200 });
  const attendance = useAttendance({ page_size: 200 });

  const grades = data.assignments
    .map((item) => item.mySubmission?.gradeValue ?? null)
    .filter((value): value is number => value !== null);
  const avgGrade = grades.length ? grades.reduce((sum, value) => sum + value, 0) / grades.length : null;

  const joined = new Set((attendance.data ?? []).filter((row) => row.joinedAt).map((row) => row.lessonId));
  const finished = (lessons.data ?? []).filter((lesson) => lesson.status === "finished");
  const attended = finished.filter((lesson) => lesson.attended ?? joined.has(lesson.id)).length;
  const rate = monthAttendanceRate(lessons.data ?? [], attendance.data ?? [], now);

  const due = data.assignments.filter(
    (item) => item.mySubmission || (item.dueAt && new Date(item.dueAt).getTime() < now.getTime())
  );
  const onTime = due.filter(
    (item) =>
      item.mySubmission &&
      (!item.dueAt || new Date(item.mySubmission.createdAt).getTime() <= new Date(item.dueAt).getTime())
  ).length;
  const homeworkRate = due.length ? Math.round((onTime / due.length) * 100) : null;

  const weeks = useMemo(() => {
    const first = startOfWeek(new Date(now.getTime() - (WEEKS - 1) * WEEK_MS), { weekStartsOn: 1 }).getTime();
    return Array.from({ length: WEEKS }, (_, index) => {
      const start = first + index * WEEK_MS;
      const items = data.attempts.filter((attempt) => {
        const time = new Date(attempt.takenAt).getTime();
        return time >= start && time < start + WEEK_MS && attempt.percentage !== null;
      });
      return items.length
        ? Math.round(items.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / items.length)
        : null;
    });
  }, [data.attempts, now]);

  const subjects = data.courses.map((course) => {
    const tests = data.attempts.filter((attempt) => attempt.courseTitle === course.title && attempt.percentage !== null);
    const marks = data.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => item.mySubmission?.gradeValue ?? null)
      .filter((value): value is number => value !== null);
    return {
      course,
      test: tests.length ? Math.round(tests.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / tests.length) : null,
      grade: marks.length ? marks.reduce((sum, value) => sum + value, 0) / marks.length : null,
    };
  });

  const stats = [
    {
      id: "grade",
      value: avgGrade === null ? "—" : decimal(avgGrade),
      hint: t("workspace.analytics.stats.gradeHint", { count: grades.length }),
      tone: "text-success-fg",
    },
    {
      id: "lessons",
      value: lessons.isLoading ? "—" : String(attended),
      hint: t("workspace.analytics.stats.lessonsHint", { count: finished.length - attended }),
      tone: "text-ink",
    },
    {
      id: "attendance",
      value: rate === null ? "—" : `${rate}%`,
      hint: t("workspace.analytics.stats.attendanceHint"),
      tone: "text-ink",
    },
    {
      id: "homework",
      value: homeworkRate === null ? "—" : `${homeworkRate}%`,
      hint: t("workspace.analytics.stats.homeworkHint"),
      tone: "text-brand",
    },
  ];

  const statCards = (
    <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.id} className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 lg:p-5">
          <small className="truncate text-body-xs text-ink-secondary">{t(`workspace.analytics.stats.${stat.id}`)}</small>
          <strong className={`truncate font-heading text-[28px]/9 font-semibold lg:text-display ${stat.tone}`}>{stat.value}</strong>
          <small className="truncate text-caption text-ink-secondary">{stat.hint}</small>
        </div>
      ))}
    </div>
  );

  const chart = (
    <section className="flex min-w-0 flex-col rounded-2xl bg-surface p-4 lg:p-5">
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <strong className="min-w-0 flex-1 truncate text-title text-ink">{t("workspace.analytics.chart.title")}</strong>
        <small className="shrink-0 text-body-xs font-medium text-brand">{t("workspace.analytics.chart.range")}</small>
      </header>
      {weeks.some((value) => value !== null) ? (
        <div className="relative mt-4" style={{ height: CHART_HEIGHT + 24 }}>
          {[0.25, 0.5, 0.75].map((line) => (
            <i
              key={line}
              className="absolute inset-x-0 h-px bg-line not-italic"
              style={{ bottom: CHART_HEIGHT * line }}
              aria-hidden="true"
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-2 px-2.5 lg:px-0">
            {weeks.map((value, index) => (
              <span key={index} className="flex w-10 min-w-0 flex-col items-center justify-end gap-1">
                {value !== null ? <small className="text-caption-strong text-ink">{value}</small> : null}
                <span
                  className="w-full rounded-t-lg bg-brand"
                  style={{ height: value === null ? 0 : Math.max(6, (value / 100) * CHART_HEIGHT) }}
                />
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="py-16 text-center text-body-sm text-ink-secondary">{t("workspace.analytics.chart.empty")}</p>
      )}
    </section>
  );

  const subjectList = (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-4 lg:p-5">
      <strong className="text-title text-ink">{t("workspace.analytics.subjects.title")}</strong>
      {subjects.length ? (
        subjects.map(({ course, test, grade }) => (
          <span key={course.id} className="flex min-h-12 items-center gap-3">
            <GroupTile
              name={course.title}
              tone={course.color}
              src={course.avatarUrl}
              className="size-9 shrink-0 rounded-lg text-caption-strong"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-body-sm font-semibold text-ink">{course.title}</strong>
              <small className="truncate text-caption text-ink-secondary">
                {[course.teacher, test === null ? "" : t("workspace.analytics.subjects.test", { value: test })]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </span>
            {grade !== null ? (
              <strong className="flex shrink-0 items-center gap-1 text-body-sm font-semibold text-warning-fg">
                <Icon name="star" size={16} />
                {decimal(grade)}
              </strong>
            ) : null}
          </span>
        ))
      ) : (
        <p className="text-body-sm text-ink-secondary">{t("workspace.analytics.subjects.empty")}</p>
      )}
    </section>
  );

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={t("workspace.analytics.title")}
          backLabel={t("workspace.back")}
          onBack={() => navigate(ROUTES.student.workspace)}
        />
        {statCards}
        {chart}
        {subjectList}
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("workspace.analytics.eyebrow")} title={t("workspace.analytics.title")}>
      {statCards}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {chart}
        {subjectList}
      </div>
    </WorkspaceShell>
  );
}

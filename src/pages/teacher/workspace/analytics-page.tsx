import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardTrends, useMyAnalytics } from "@/modules/analytics";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { WorkspaceShell } from "@/widgets/workspace-shell";

const BAR_COUNT = 8;

function round(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function WorkspaceAnalyticsPage() {
  const { t } = useTranslation("workspace");
  const analytics = useMyAnalytics();
  const trends = useDashboardTrends("week");

  const stats = analytics.data?.kind === "teacher" ? analytics.data.overall : null;
  const courses = useMemo(
    () => (analytics.data?.kind === "teacher" ? analytics.data.courses : []),
    [analytics.data]
  );

  const attendance = useMemo(() => {
    const values = courses
      .map((course) => course.attendanceRate)
      .filter((value): value is number => value !== null);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [courses]);

  const bars = useMemo(() => {
    const scores = (trends.data?.quizAvgScore ?? []).slice(-BAR_COUNT);
    const labels = (trends.data?.labels ?? []).slice(-BAR_COUNT);
    return scores.map((value, index) => ({
      label: labels[index] ?? "",
      value: value === null ? null : Math.round(value),
    }));
  }, [trends.data]);

  const maxBar = Math.max(100, ...bars.map((bar) => bar.value ?? 0));

  return (
    <WorkspaceShell eyebrow={t("stats.eyebrow")} title={t("analytics.title")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("analytics.avgRating")}
          value={stats?.avgRating === null || !stats ? "—" : stats.avgRating.toFixed(1).replace(".", ",")}
          tone="text-success-fg"
          hint={t("stats.ratingHint", { count: stats?.ratingCount ?? 0 })}
        />
        <StatCard
          label={t("analytics.lessonsFinished")}
          value={String(stats?.lessonsFinished ?? 0)}
          hint={t("stats.cancelledHint", { count: stats?.lessonsCancelled ?? 0 })}
        />
        <StatCard
          label={t("analytics.attendance")}
          value={round(attendance)}
          tone="text-brand-strong"
          hint={t("stats.monthHint")}
        />
        <StatCard
          label={t("analytics.reliability")}
          value={round(stats?.reliability ?? null)}
          tone="text-brand-strong"
          hint={t("stats.reliabilityHint")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col gap-5 rounded-lg bg-surface p-6">
          <div className="flex items-center gap-3">
            <strong className="min-w-0 flex-1 truncate text-title text-ink">
              {t("stats.chartTitle")}
            </strong>
            <small className="shrink-0 text-body-xs text-brand">{t("stats.chartRange")}</small>
          </div>

          {bars.length ? (
            <div className="flex h-60 items-end gap-4">
              {bars.map((bar, index) => {
                const last = index === bars.length - 1;
                return (
                  <span key={`${bar.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <small className="text-body-xs text-ink-secondary">{bar.value ?? "—"}</small>
                    <i
                      className={`block w-full rounded-t-sm ${last ? "bg-brand" : "bg-brand/35"}`}
                      style={{ height: `${((bar.value ?? 0) / maxBar) * 190}px` }}
                    />
                    <small className="w-full truncate text-center text-caption text-ink-tertiary">
                      {bar.label}
                    </small>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-body-sm text-ink-tertiary">
              {t("stats.chartEmpty")}
            </p>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-lg bg-surface p-6">
          <strong className="text-title text-ink">{t("analytics.byCourse")}</strong>

          {courses.map((course) => (
            <span key={course.courseId} className="flex items-center gap-3">
              <GroupTile name={course.courseTitle} className="size-9 rounded-md text-caption-strong" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{course.courseTitle}</strong>
                <small className="truncate text-body-xs text-ink-tertiary">
                  {t("analytics.studentCountValue", { count: course.studentCount ?? 0 })}
                  {course.quizAvgPercentage === null
                    ? ""
                    : ` · ${t("stats.quizShort", { value: Math.round(course.quizAvgPercentage) })}`}
                </small>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-title-sm text-saffron-strong">
                <Icon name="star" size={15} />
                {course.avgRating === null ? "—" : course.avgRating.toFixed(1).replace(".", ",")}
              </span>
            </span>
          ))}

          {!courses.length ? (
            <p className="py-8 text-center text-body-sm text-ink-tertiary">
              {t("analytics.noCourses")}
            </p>
          ) : null}
        </section>
      </div>
    </WorkspaceShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
      <small className="truncate text-body-xs text-ink-tertiary">{hint}</small>
    </div>
  );
}

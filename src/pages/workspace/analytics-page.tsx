import { useTranslation } from "react-i18next";
import { useMyAnalytics } from "@/modules/analytics";
import { formatDateTime } from "@/shared/lib";
import type { StudentAnalytics, TeacherAnalytics } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

function StatCard({
  icon,
  tone,
  value,
  label,
}: {
  icon: string;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <article className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={17} />
      </span>
      <strong className="font-heading text-h2 text-ink">{value}</strong>
      <small className="text-caption text-ink-secondary">{label}</small>
    </article>
  );
}

function Meter({ label, value, tone }: { label: string; value: string; tone: string }) {
  const width = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  const ratio = value.includes("/")
    ? (Number.parseFloat(value) / 5) * 100
    : Number.isFinite(width)
      ? width
      : 0;

  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2">
        <small className="flex-1 text-body-sm text-ink-secondary">{label}</small>
        <small className="font-numeric text-label-strong text-ink">{value}</small>
      </span>
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <span
          className={`block h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, ratio))}%` }}
        />
      </span>
    </span>
  );
}

function StudentView({ data }: { data: StudentAnalytics }) {
  const { t } = useTranslation("workspace");
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon="assign"
          tone="bg-action text-on-action"
          value={String(data.attemptCount)}
          label={t("analytics.attemptCount")}
        />
        <StatCard
          icon="check-circle"
          tone="bg-success text-white"
          value={percent(data.avgPercentage)}
          label={t("analytics.avgPercentage")}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{t("analytics.recentAttempts")}</h2>
        {data.recentAttempts.length ? (
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            {data.recentAttempts.map((item, index) => (
              <span
                key={`${item.quizId}-${index}`}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">{item.quizTitle}</strong>
                  <small className="truncate text-caption text-ink-tertiary">
                    {`${item.courseTitle} · ${formatDateTime(item.takenAt)}`}
                  </small>
                </span>
                <strong className="shrink-0 font-numeric text-label-strong text-action">
                  {percent(item.percentage)}
                </strong>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-ink-tertiary">{t("analytics.noAttempts")}</p>
        )}
      </section>
    </>
  );
}

function TeacherView({ data }: { data: TeacherAnalytics }) {
  const { t } = useTranslation("workspace");
  const overall = data.overall;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon="check-circle"
          tone="bg-saffron-strong text-white"
          value={overall.avgRating === null ? "—" : overall.avgRating.toFixed(1)}
          label={t("analytics.avgRating")}
        />
        <StatCard
          icon="done-all"
          tone="bg-success text-white"
          value={String(overall.ratingCount)}
          label={t("analytics.ratingCount")}
        />
        <StatCard
          icon="school"
          tone="bg-action text-on-action"
          value={String(overall.courseCount)}
          label={t("analytics.courseCount")}
        />
        <StatCard
          icon="person"
          tone="bg-action text-on-action"
          value={String(overall.studentCount)}
          label={t("analytics.studentCount")}
        />
        <StatCard
          icon="nav-calendar"
          tone="bg-action text-on-action"
          value={String(overall.lessonsFinished)}
          label={t("analytics.lessonsFinished")}
        />
        <StatCard
          icon="check-circle"
          tone="bg-success text-white"
          value={percent(overall.reliability)}
          label={t("analytics.reliability")}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">{t("analytics.byCourse")}</h2>
        {data.courses.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.courses.map((course) => (
              <article
                key={course.courseId}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-center gap-3 border-b border-line pb-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action">
                    <Icon name="groups" size={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title text-ink">{course.courseTitle}</strong>
                    <small className="text-caption text-ink-tertiary">
                      {t("analytics.studentCountValue", { count: course.studentCount ?? 0 })}
                    </small>
                  </span>
                </div>

                <Meter
                  label={t("analytics.avgRating")}
                  value={course.avgRating === null ? "—" : `${course.avgRating.toFixed(1)} / 5`}
                  tone="bg-saffron-strong"
                />
                <Meter
                  label={t("analytics.quizAvg")}
                  value={percent(course.quizAvgPercentage)}
                  tone="bg-action"
                />
                <Meter
                  label={t("analytics.attendance")}
                  value={percent(course.attendanceRate)}
                  tone="bg-success"
                />
                <Meter
                  label={t("analytics.reliability")}
                  value={percent(course.reliability)}
                  tone="bg-ink"
                />
              </article>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-ink-tertiary">{t("analytics.noCourses")}</p>
        )}
      </section>
    </>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation("workspace");
  const query = useMyAnalytics();

  if (query.isLoading)
    return (
      <div className="flex h-full flex-col gap-4 bg-canvas p-4 lg:p-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-28 min-w-[150px] flex-1 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );

  if (query.isError || !query.data)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-error-bg text-error-text">
          <Icon name="error" size={26} />
        </span>
        <strong className="font-heading text-h3 text-ink">{t("analytics.loadError")}</strong>
        <button
          type="button"
          className="mt-1 flex h-12 items-center rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => query.refetch()}
        >
          {t("analytics.retry")}
        </button>
      </div>
    );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas p-4 lg:p-6">
      <p className="text-body-sm text-ink-secondary">{t("analytics.subtitle")}</p>

      {query.data.kind === "student" ? (
        <StudentView data={query.data} />
      ) : (
        <TeacherView data={query.data} />
      )}
    </div>
  );
}

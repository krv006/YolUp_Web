import { useTranslation } from "react-i18next";
import { useMyAnalytics } from "@/modules/analytics";
import { formatDateTime } from "@/shared/lib";
import type { StudentAnalytics, TeacherAnalytics } from "@/shared/types";
import { LoadingFallback, RouteState, PageBackLink } from "@/shared/ui/legacy";

function percent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function StudentView({ data }: { data: StudentAnalytics }) {
  const { t } = useTranslation("workspace");
  return (
    <>
      <div className="teacher-stats-grid">
        <article>
          <strong>{data.attemptCount}</strong>
          <small>{t("analytics.attemptCount")}</small>
        </article>
        <article>
          <strong>{percent(data.avgPercentage)}</strong>
          <small>{t("analytics.avgPercentage")}</small>
        </article>
      </div>

      <section className="analytics-section">
        <span className="info-section-title">{t("analytics.recentAttempts")}</span>
        {data.recentAttempts.length ? (
          <ul className="analytics-attempt-list">
            {data.recentAttempts.map((item) => (
              <li key={`${item.quizId}-${item.takenAt}`}>
                <div>
                  <strong>{item.quizTitle}</strong>
                  <small>{item.courseTitle}</small>
                </div>
                <span className="analytics-score">
                  {item.score}/{item.maxScore}
                </span>
                <b>{percent(item.percentage)}</b>
                <time>{item.takenAt ? formatDateTime(item.takenAt) : ""}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="portal-muted">{t("analytics.noAttempts")}</p>
        )}
      </section>
    </>
  );
}

function TeacherView({ data }: { data: TeacherAnalytics }) {
  const { t } = useTranslation("workspace");
  const { overall } = data;
  return (
    <>
      <div className="teacher-stats-grid">
        <article>
          <strong>{overall.avgRating === null ? "—" : overall.avgRating.toFixed(1)}</strong>
          <small>{t("analytics.avgRating")}</small>
        </article>
        <article>
          <strong>{overall.ratingCount}</strong>
          <small>{t("analytics.ratingCount")}</small>
        </article>
        <article>
          <strong>{overall.courseCount}</strong>
          <small>{t("analytics.courseCount")}</small>
        </article>
        <article>
          <strong>{overall.studentCount}</strong>
          <small>{t("analytics.studentCount")}</small>
        </article>
        <article>
          <strong>{overall.lessonsFinished}</strong>
          <small>{t("analytics.lessonsFinished")}</small>
        </article>
        <article>
          <strong>{percent(overall.reliability)}</strong>
          <small>{t("analytics.reliability")}</small>
        </article>
      </div>

      <section className="analytics-section">
        <span className="info-section-title">{t("analytics.byCourse")}</span>
        {data.courses.length ? (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>{t("analytics.course")}</th>
                  <th>{t("analytics.studentCount")}</th>
                  <th>{t("analytics.avgRating")}</th>
                  <th>{t("analytics.quizAvg")}</th>
                  <th>{t("analytics.attendance")}</th>
                  <th>{t("analytics.reliability")}</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((course) => (
                  <tr key={course.courseId}>
                    <td>{course.courseTitle}</td>
                    <td>{course.studentCount ?? "—"}</td>
                    <td>{course.avgRating === null ? "—" : course.avgRating.toFixed(1)}</td>
                    <td>{percent(course.quizAvgPercentage)}</td>
                    <td>{percent(course.attendanceRate)}</td>
                    <td>{percent(course.reliability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="portal-muted">{t("analytics.noCourses")}</p>
        )}
      </section>
    </>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation("workspace");
  const query = useMyAnalytics();

  if (query.isLoading) return <LoadingFallback label={t("analytics.loading")} />;
  if (query.isError || !query.data)
    return (
      <RouteState
        title={t("analytics.loadError")}
        actionLabel={t("analytics.retry")}
        onAction={query.refetch}
      />
    );

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("analytics.eyebrow")}</span>
          <h1>{t("analytics.title")}</h1>
          <p>{t("analytics.subtitle")}</p>
        </div>
      </div>

      {query.data.kind === "student" ? (
        <StudentView data={query.data} />
      ) : (
        <TeacherView data={query.data} />
      )}
    </div>
  );
}

import { useState } from "react";
import {
  Award,
  LifeBuoy,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { Button, LoadingFallback, RouteState } from "@/shared/ui/legacy";
import {
  TrendLineChart,
  TrendStackedBarChart,
  useDashboardSummary,
  useDashboardTrends,
} from "@/modules/analytics";
import { NotificationBell, SentNotificationsPanel, type NotificationLink } from "@/modules/notification";
import { can, PERMISSIONS } from "@/modules/permission";
import { ServerMonitoringPanel, StoragePanel } from "./system-panels";
import type { DashboardPeriod } from "@/shared/types";

const PERIODS: DashboardPeriod[] = ["day", "week", "month", "year"];

function starIcon() {
  return <Star size={12} />;
}

function Pill({ value, threshold, suffix }: { value: number | null; threshold: number; suffix: string }) {
  if (value == null) return <span className="dash-pill">—</span>;
  return <span className={`dash-pill ${value >= threshold ? "is-good" : "is-warn"}`}>{value}{suffix}</span>;
}

export function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const summary = useDashboardSummary();
  const trends = useDashboardTrends(period);

  function openNotificationLink(link: NotificationLink) {
    if (link.type === "teacher") {
      navigate(`${ROUTES.admin.teachers}?teacher=${encodeURIComponent(link.id)}`);
    }
    if (link.type === "certificate") {
      navigate(`${ROUTES.admin.certificates}?certificate=${encodeURIComponent(link.id)}`);
    }
    if (link.type === "support") {
      navigate(`${ROUTES.admin.support}?ticket=${encodeURIComponent(link.id)}`);
    }
  }

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (summary.isLoading || trends.isLoading) return <LoadingFallback label={t("dashboard.loading")} />;
  if (summary.isError || trends.isError) {
    return (
      <RouteState
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.loadError")}
        description={summary.error?.message ?? trends.error?.message}
        actionLabel={t("dashboard.retry")}
        onAction={() => {
          summary.refetch();
          trends.refetch();
        }}
      />
    );
  }

  const s = summary.data!;
  const trendData = trends.data!;
  const lastIndex = trendData.labels.length - 1;
  const noun = t(`dashboard.periodNoun.${period}`);

  return (
    <main className="portal-page admin-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow"><ShieldCheck size={14} /> {t("dashboard.eyebrow")}</span>
          <h1>{t("dashboard.welcome", { name: user?.name })}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <div className="heading-actions">
          <Link className="portal-primary-link" to={ROUTES.admin.teachers}>
            <UsersRound size={15} /> {t("dashboard.teachersLink")}
          </Link>
          <Link className="portal-primary-link" to={ROUTES.admin.certificates}>
            <Award size={15} /> {t("dashboard.certificatesLink")}
          </Link>
          <Link className="portal-primary-link" to={ROUTES.admin.support}>
            <LifeBuoy size={15} /> {t("dashboard.supportLink")}
          </Link>
          <NotificationBell enabled={Boolean(user)} onOpenLink={openNotificationLink} />
          <Button variant="secondary" onClick={signOut}>
            <LogOut size={17} /> {t("dashboard.logout")}
          </Button>
        </div>
      </div>

      <div className="dash-topbar">
        <div className="dash-period-switch">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={period === p ? "is-active" : ""}
              onClick={() => setPeriod(p)}
            >
              {t(`dashboard.periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      <section className="dash-kpi-grid">
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-blue-bg)", color: "var(--tone-blue-fg)" }}>
            <UsersRound />
          </div>
          <div className="dash-kpi-num">{s.activeStudents}</div>
          <div className="dash-kpi-label">{t("dashboard.kpi.activeStudents")}</div>
        </article>
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-violet-bg)", color: "var(--tone-violet-fg)" }}>
            <GraduationCap />
          </div>
          <div className="dash-kpi-num">{s.activeTeachers}</div>
          <div className="dash-kpi-label">{t("dashboard.kpi.activeTeachers")}</div>
        </article>
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-amber-bg)", color: "var(--tone-amber-fg)" }}>
            <BookOpen />
          </div>
          <div className="dash-kpi-num">{s.activeCourses}</div>
          <div className="dash-kpi-label">{t("dashboard.kpi.activeCourses")}</div>
        </article>
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-emerald-bg)", color: "var(--tone-emerald-fg)" }}>
            <CalendarCheck />
          </div>
          <div className="dash-kpi-num">{trendData.lessonsCompleted[lastIndex] ?? 0}</div>
          <div className="dash-kpi-label">{t("dashboard.kpi.lessonsCompleted")}</div>
          <span className="dash-kpi-delta">
            {t("dashboard.kpi.lessonsCancelledCaption", { count: trendData.lessonsCancelled[lastIndex] ?? 0, noun })}
          </span>
        </article>
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-rose-bg)", color: "var(--tone-rose-fg)" }}>
            <CheckCircle2 />
          </div>
          <div className="dash-kpi-num">
            {trendData.attendanceRate[lastIndex] != null ? `${trendData.attendanceRate[lastIndex]}%` : "—"}
          </div>
          <div className="dash-kpi-label">{t("dashboard.kpi.attendance")}</div>
          <span className="dash-kpi-delta">{t("dashboard.kpi.attendanceCaption", { noun })}</span>
        </article>
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "var(--tone-blue-bg)", color: "var(--tone-blue-fg)" }}>
            <Star />
          </div>
          <div className="dash-kpi-num">{s.avgRating != null ? s.avgRating.toFixed(1) : "—"}</div>
          <div className="dash-kpi-label">{t("dashboard.kpi.rating")}</div>
          <span className="dash-kpi-delta">{t("dashboard.kpi.ratingCaption", { count: s.ratingCount })}</span>
        </article>
      </section>

      <section className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h3>{t("dashboard.charts.enrollTitle")}</h3>
              <p>{t("dashboard.charts.periodCaption")}</p>
            </div>
            <div className="dash-legend">
              <span className="dash-legend-item">
                <span className="dash-legend-dot" style={{ background: "var(--chart-1)" }} />
                {t("dashboard.charts.enrollLegend")}
              </span>
            </div>
          </div>
          <TrendLineChart
            labels={trendData.labels}
            series={[{
              key: "enroll", name: t("dashboard.charts.enrollLegend"), color: "var(--chart-1)",
              values: trendData.enrollments, area: true,
            }]}
          />
        </div>
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h3>{t("dashboard.charts.lessonsTitle")}</h3>
              <p>{t("dashboard.charts.periodCaption")}</p>
            </div>
            <div className="dash-legend">
              <span className="dash-legend-item">
                <span className="dash-legend-dot" style={{ background: "var(--chart-2)" }} />
                {t("dashboard.charts.completedLegend")}
              </span>
              <span className="dash-legend-item">
                <span className="dash-legend-dot" style={{ background: "var(--chart-4)" }} />
                {t("dashboard.charts.cancelledLegend")}
              </span>
            </div>
          </div>
          <TrendStackedBarChart
            labels={trendData.labels}
            series={[
              { key: "completed", name: t("dashboard.charts.completedLegend"), color: "var(--chart-2)", values: trendData.lessonsCompleted },
              { key: "cancelled", name: t("dashboard.charts.cancelledLegend"), color: "var(--chart-4)", values: trendData.lessonsCancelled },
            ]}
          />
        </div>
      </section>

      <section className="dash-panel" style={{ marginBottom: 16 }}>
        <div className="dash-panel-head">
          <div>
            <h3>{t("dashboard.charts.quizTitle")}</h3>
            <p>{t("dashboard.charts.quizCaption")}</p>
          </div>
          <div className="dash-legend">
            <span className="dash-legend-item">
              <span className="dash-legend-dot" style={{ background: "var(--chart-5)" }} />
              {t("dashboard.charts.quizLegend")}
            </span>
          </div>
        </div>
        <TrendLineChart
          zeroBase={false}
          labels={trendData.labels}
          series={[{ key: "quiz", name: t("dashboard.charts.quizLegend"), color: "var(--chart-5)", values: trendData.quizAvgScore }]}
        />
      </section>

      <section className="dash-grid-2">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div><h3>{t("dashboard.tables.topCoursesTitle")}</h3><p>{t("dashboard.tables.topCoursesSubtitle")}</p></div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("dashboard.tables.colCourse")}</th>
                  <th>{t("dashboard.tables.colTeacher")}</th>
                  <th>{t("dashboard.tables.colStudents")}</th>
                  <th>{t("dashboard.tables.colRating")}</th>
                  <th>{t("dashboard.tables.colAttendance")}</th>
                </tr>
              </thead>
              <tbody>
                {s.topCourses.map((course, index) => (
                  <tr key={course.id}>
                    <td><span className="dash-rank">{index + 1}</span></td>
                    <td className="cell-primary">{course.title}</td>
                    <td>{course.teacherName}</td>
                    <td>{course.studentCount}</td>
                    <td>
                      <span className="dash-stars">
                        {starIcon()} {course.avgRating != null ? course.avgRating.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td><Pill value={course.attendanceRate} threshold={85} suffix="%" /></td>
                  </tr>
                ))}
                {!s.topCourses.length ? (
                  <tr><td colSpan={6} className="portal-muted">{t("dashboard.tables.noCourses")}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div><h3>{t("dashboard.tables.topTeachersTitle")}</h3><p>{t("dashboard.tables.topTeachersSubtitle")}</p></div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("dashboard.tables.colTeacher")}</th>
                  <th>{t("dashboard.tables.colCourses")}</th>
                  <th>{t("dashboard.tables.colLessonsThisMonth")}</th>
                  <th>{t("dashboard.tables.colRating")}</th>
                  <th>{t("dashboard.tables.colReliability")}</th>
                </tr>
              </thead>
              <tbody>
                {s.topTeachers.map((teacher, index) => (
                  <tr key={teacher.id}>
                    <td><span className="dash-rank">{index + 1}</span></td>
                    <td className="cell-primary">{teacher.name}</td>
                    <td>{teacher.courseCount}</td>
                    <td>{teacher.lessonsThisMonth}</td>
                    <td>
                      <span className="dash-stars">
                        {starIcon()} {teacher.avgRating != null ? teacher.avgRating.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td><Pill value={teacher.reliability} threshold={85} suffix="%" /></td>
                  </tr>
                ))}
                {!s.topTeachers.length ? (
                  <tr><td colSpan={6} className="portal-muted">{t("dashboard.tables.noTeachers")}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <StoragePanel />
      <ServerMonitoringPanel />

      {can(user, PERMISSIONS.NOTIFICATION_SEND) ? <SentNotificationsPanel /> : null}
    </main>
  );
}

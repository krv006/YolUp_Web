import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { parentHome, parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { ScoreCard } from "../dashboard/home-side";
import { useHomeworkView } from "../homework/use-homework-view";
import { GradeRow } from "./results-parts";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ParentCoursePage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { courseId = "" } = useParams();
  const compact = useIsCompact();
  const view = useHomeworkView();
  if (!compact) return <Navigate to={ROUTES.parent.grades} replace />;

  const course = view.courseById.get(courseId);
  const assignments = view.assignments.filter((item) => item.courseId === courseId);
  const row = parentResults.subjectRows(assignments, new Map(course ? [[courseId, course.title]] : []))[0];
  const points = parentHome.gradedScores(assignments);
  const graded = assignments
    .filter((item) => item.mySubmission)
    .sort((a, b) => (b.mySubmission?.createdAt ?? "").localeCompare(a.mySubmission?.createdAt ?? ""));
  const average = row?.average ?? null;
  const title = course?.title || assignments[0]?.courseTitle || "";

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={title} backLabel={t("results.title")} onBack={() => navigate(ROUTES.parent.grades)} />
      {view.loading ? (
        <span className="h-[360px] animate-pulse rounded-[20px] bg-surface" aria-hidden="true" />
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-[20px] bg-surface p-4">
            <span className="relative grid size-[88px] shrink-0 place-items-center">
              <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="44" cy="44" r={RADIUS} fill="none" strokeWidth="8" className="stroke-success-bg" />
                {average !== null ? (
                  <circle cx="44" cy="44" r={RADIUS} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-success" strokeDasharray={`${(average / 10) * CIRCUMFERENCE} ${CIRCUMFERENCE}`} />
                ) : null}
              </svg>
              <strong className="font-heading text-[22px]/7 font-semibold text-ink">{average ?? "—"}</strong>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("results.panel.average")}</strong>
              <small className="text-body-xs text-ink-secondary">
                {[course?.teacher, row ? t("results.panel.counts", { submitted: row.submitted, total: row.total, graded: points.length }) : ""].filter(Boolean).join(" · ")}
              </small>
            </span>
          </section>
          {points.length ? <ScoreCard trend={parentHome.scoreTrend(points, view.now, 6)} delta={null} width={340} gradientId="course-mobile-fill" /> : null}
          <h2 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">{t("results.panel.grades")}</h2>
          {graded.length ? (
            <ul className="overflow-hidden rounded-[20px] bg-surface">
              {graded.map((assignment) => (
                <GradeRow key={assignment.id} assignment={assignment} />
              ))}
            </ul>
          ) : (
            <p className="rounded-[20px] bg-surface px-4 py-8 text-center text-body-sm text-ink-tertiary">{t("results.panel.noGrades")}</p>
          )}
        </>
      )}
    </div>
  );
}

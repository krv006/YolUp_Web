import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLessons } from "@/modules/lesson";
import { parentFamily, parentHome, type SubjectRow } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import type { Assignment, Course } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { subjectLook } from "../attendance/attendance-styles";
import { ScoreCard } from "../dashboard/home-side";
import { GradeRow } from "./results-parts";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ResultsCoursePanel({
  row,
  course,
  assignments,
  now,
  onClose,
}: {
  row: SubjectRow | null;
  course: Course | undefined;
  assignments: Assignment[];
  now: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const scheduled = useLessons({ status: "scheduled", ordering: "starts_at", page_size: 50 }, Boolean(row));
  const weekdays = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${row?.title ?? ""}`);
  const schedule = row ? parentFamily.courseSchedule(scheduled.data ?? [], row.courseId, now) : null;
  const points = parentHome.gradedScores(assignments);
  const trend = parentHome.scoreTrend(points, now, 6);
  const graded = assignments
    .filter((item) => item.mySubmission)
    .sort((a, b) => (b.mySubmission?.createdAt ?? "").localeCompare(a.mySubmission?.createdAt ?? ""));
  const average = row?.average ?? null;
  const description = [
    schedule ? `${schedule.days.map((day) => weekdays[day] ?? "").join(", ")} · ${schedule.time}` : "",
    course?.teacher ?? "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AppDialog
      open={Boolean(row)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="panel"
      width="lg:w-115"
      icon={
        <span className={`grid size-12 place-items-center rounded-2xl ${look.tone}`}>
          <Icon name={look.icon} size={24} />
        </span>
      }
      title={row?.title ?? ""}
      description={description || undefined}
      titleClassName="font-heading text-[20px]/7 font-semibold"
      footerClassName="justify-end px-5 pt-4 pb-5"
      footer={
        <>
          <button
            type="button"
            className="flex h-13 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-5 text-title-sm font-semibold text-ink transition-colors hover:bg-subtle lg:h-11 lg:flex-none lg:text-button"
            onClick={onClose}
          >
            {t("results.panel.close")}
          </button>
          <button
            type="button"
            className="flex h-13 flex-1 items-center justify-center rounded-full bg-brand px-5 text-title-sm font-semibold text-on-action transition-colors hover:bg-brand-strong lg:h-11 lg:flex-none lg:text-button"
            onClick={() => navigate(ROUTES.parent.attendance)}
          >
            {t("results.panel.attendance")}
          </button>
        </>
      }
    >
      {row ? (
        <div className="flex flex-col gap-5 pb-2">
          <section className="flex items-center gap-5 rounded-2xl bg-subtle px-5 py-4">
            <span className="relative grid size-[88px] shrink-0 place-items-center">
              <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="44" cy="44" r={RADIUS} fill="none" strokeWidth="8" className="stroke-surface" />
                {average !== null ? (
                  <circle
                    cx="44"
                    cy="44"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="stroke-success"
                    strokeDasharray={`${(average / 10) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  />
                ) : null}
              </svg>
              <strong className="font-heading text-[22px]/7 font-semibold text-ink">{average ?? "—"}</strong>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("results.panel.average")}</strong>
              <small className="text-body-sm text-ink-secondary">
                {t("results.panel.counts", { submitted: row.submitted, total: row.total, graded: points.length })}
              </small>
            </span>
          </section>

          {points.length ? (
            <ScoreCard trend={trend} delta={null} gradientId="course-score-fill" />
          ) : null}

          <section className="flex flex-col gap-2">
            <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("results.panel.grades")}</small>
            {graded.length ? (
              <ul className="overflow-hidden rounded-2xl border border-line">
                {graded.map((assignment) => (
                  <GradeRow key={assignment.id} assignment={assignment} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-subtle px-4 py-6 text-center text-body-sm text-ink-tertiary">{t("results.panel.noGrades")}</p>
            )}
          </section>
        </div>
      ) : null}
    </AppDialog>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { parentHome, parentResults, type SubjectRow } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { subjectLook } from "../attendance/attendance-styles";
import { ConnectChild } from "../dashboard/home-empty";
import { ChildScoreChart } from "@/widgets/child-score-chart";
import { useHomeworkView } from "../homework/use-homework-view";
import { ResultsCoursePanel } from "./results-course-panel";
import { GradeRow, MonthPicker, ResultsTabs } from "./results-parts";

function Tile({
  icon,
  tone,
  label,
  value,
  hint,
  delta,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  hint?: string;
  delta?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-4">
      <span className="flex items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
          <Icon name={icon} size={20} />
        </span>
        {delta ? <span className="rounded-full bg-success-bg px-2 py-0.5 text-caption-strong text-success-text">{delta}</span> : null}
      </span>
      <small className="mt-2 text-caption text-ink-secondary">{label}</small>
      <strong className="font-heading text-[28px]/9 font-semibold text-ink">{value}</strong>
      {hint ? <small className="truncate text-caption text-ink-tertiary">{hint}</small> : null}
    </div>
  );
}

export function ParentResults() {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const today = new Date(view.now);
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [opened, setOpened] = useState<SubjectRow | null>(null);
  const childName = view.child?.name ?? "";

  const assignments = view.assignments;
  const months = parentResults.activeMonths(assignments, view.now);
  const current = parentResults.monthHomework(assignments, period.year, period.month);
  const previousDate = new Date(period.year, period.month - 1, 1);
  const previous = parentResults.monthHomework(assignments, previousDate.getFullYear(), previousDate.getMonth());
  const percentDelta = parentResults.delta(current.percent, previous.percent);
  const averageDelta = parentResults.delta(current.average, previous.average);
  const points = parentHome.gradedScores(assignments);
  const titles = new Map(
    [...view.courseById.values()].filter((course) => assignments.some((item) => item.courseId === course.id)).map((course) => [course.id, course.title])
  );
  const subjects = parentResults.subjectRows(assignments, titles);
  const recent = parentResults.recentGrades(assignments);
  const monthName = formatLocalized(new Date(period.year, period.month, 1), "LLLL");
  const signed = (value: number | null, suffix = "") => (value ? `${value > 0 ? "+" : ""}${value}${suffix}` : null);

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={childName ? `${t("results.eyebrow")} · ${childName}` : t("results.eyebrow")}
        title={t("results.title")}
      />
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}

      {!view.loading && !view.child ? (
        <ConnectChild />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-center gap-3">
              <ResultsTabs />
              <span className="flex-1" />
              <MonthPicker months={months} value={period} onChange={setPeriod} />
            </div>
            <div className={`grid grid-cols-4 gap-4 ${view.loading ? "animate-pulse" : ""}`}>
              <Tile icon="assignment" tone="bg-accent-blue-bg text-accent-blue-fg" label={t("results.stats.given")} value={String(current.given)} hint={monthName} />
              <Tile
                icon="check-circle"
                tone="bg-accent-green-bg text-accent-green-fg"
                label={t("results.stats.submitted")}
                value={current.percent === null ? "—" : `${current.percent}%`}
                hint={`${current.submitted} / ${current.given}`}
                delta={signed(percentDelta, "%")}
              />
              <Tile
                icon="trending-up"
                tone="bg-accent-violet-bg text-accent-violet-fg"
                label={t("results.stats.average")}
                value={current.average === null ? "—" : String(current.average)}
                hint={current.average === null ? undefined : t("results.stats.scale")}
                delta={signed(averageDelta)}
              />
              <Tile
                icon="bar-chart"
                tone="bg-accent-saffron-bg text-accent-saffron-fg"
                label={t("results.stats.subjects")}
                value={String(current.subjects.length)}
                hint={current.subjects.map((title) => title.split(/[\s·]+/)[0]).join(", ")}
              />
            </div>

            <ChildScoreChart childId={view.child?.id ?? null} title={t("results.chart")} />
            {points.length ? (
              <>
                <section className="flex flex-col gap-3">
                  <div className="flex items-center">
                    <strong className="flex-1 text-title text-ink">{t("results.recent")}</strong>
                    <Link to={ROUTES.parent.homework} className="text-body-sm font-medium text-brand hover:opacity-80">
                      {t("results.all")}
                    </Link>
                  </div>
                  <ul className="overflow-hidden rounded-[20px] bg-surface">
                    {recent.map((assignment) => (
                      <GradeRow key={assignment.id} assignment={assignment} />
                    ))}
                  </ul>
                </section>
              </>
            ) : view.loading ? null : (
              <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-16 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
                  <Icon name="bar-chart" size={30} />
                </span>
                <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("results.empty.title")}</strong>
                <p className="max-w-[320px] text-body-sm text-ink-secondary">{t("results.empty.text")}</p>
              </section>
            )}
          </div>

          <section className="flex min-w-0 flex-col gap-3">
            <strong className="text-title text-ink">{t("results.subjects")}</strong>
            <ul className="overflow-hidden rounded-[20px] bg-surface">
              {subjects.map((row) => {
                const course = view.courseById.get(row.courseId);
                const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${row.title}`);
                const share = row.total ? row.submitted / row.total : 0;
                return (
                  <li key={row.courseId} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-subtle"
                      onClick={() => setOpened(row)}
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${look.tone}`}>
                        <Icon name={look.icon} size={22} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex items-center gap-2">
                          <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">{row.title}</strong>
                          <small className="text-caption text-ink-tertiary">
                            {row.submitted}/{row.total}
                          </small>
                        </span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
                          <span
                            className={`block h-full rounded-full ${share >= 0.8 ? "bg-success" : "bg-brand"}`}
                            style={{ width: `${share * 100}%` }}
                          />
                        </span>
                      </span>
                      <span className="flex w-14 shrink-0 flex-col items-end">
                        <strong className="font-heading text-[20px]/7 font-semibold text-ink">{row.average ?? "—"}</strong>
                        <small className="text-caption text-ink-tertiary">{t("results.average")}</small>
                      </span>
                      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
                    </button>
                  </li>
                );
              })}
              {!subjects.length ? (
                <li className="px-5 py-8 text-center text-body-sm text-ink-tertiary">{t("results.noSubjects")}</li>
              ) : null}
            </ul>
          </section>
        </div>
      )}

      <ResultsCoursePanel
        row={opened}
        course={opened ? view.courseById.get(opened.courseId) : undefined}
        childId={view.child?.id ?? null}
        assignments={opened ? assignments.filter((item) => item.courseId === opened.courseId) : []}
        now={view.now}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { parentHome, parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobileTitleHeader, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ParentErrorBanner } from "@/widgets/parent-shell";
import { subjectLook } from "../attendance/attendance-styles";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { ScoreCard } from "../dashboard/home-side";
import { useHomeworkView } from "../homework/use-homework-view";
import { ResultsTabs } from "./results-parts";

export function ResultsMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const today = new Date(view.now);
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const assignments = view.assignments;
  const months = parentResults.activeMonths(assignments, view.now);
  const current = parentResults.monthHomework(assignments, period.year, period.month);
  const previousDate = new Date(period.year, period.month - 1, 1);
  const previous = parentResults.monthHomework(assignments, previousDate.getFullYear(), previousDate.getMonth());
  const points = parentHome.gradedScores(assignments);
  const titles = new Map(
    [...view.courseById.values()].filter((course) => assignments.some((item) => item.courseId === course.id)).map((course) => [course.id, course.title])
  );
  const subjects = parentResults.subjectRows(assignments, titles);

  const tiles = [
    { icon: "assignment", tone: "bg-accent-blue-bg text-accent-blue-fg", value: String(current.given), label: t("results.stats.given") },
    {
      icon: "check-circle",
      tone: "bg-accent-green-bg text-accent-green-fg",
      value: `${current.percent ?? 0}%`,
      label: `${t("results.stats.submitted")} · ${current.submitted}/${current.given}`,
    },
    { icon: "trending-up", tone: "bg-accent-violet-bg text-accent-violet-fg", value: current.average === null ? "—" : String(current.average), label: t("results.stats.average") },
    { icon: "bar-chart", tone: "bg-accent-saffron-bg text-accent-saffron-fg", value: String(current.subjects.length), label: t("results.stats.subjects") },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <MobileTitleHeader
        eyebrow={t("results.eyebrow")}
        title={t("results.title")}
        action={
          <label className={`${mobileRoundButton} relative bg-surface`} aria-label={t("results.month")}>
            <Icon name="tune" size={22} />
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              value={`${period.year}-${period.month}`}
              onChange={(event) => {
                const [year, month] = event.target.value.split("-").map(Number);
                setPeriod({ year, month });
              }}
            >
              {months.map((item) => (
                <option key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
                  {formatLocalized(new Date(item.year, item.month, 1), "LLLL yyyy")}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <ResultsTabs wide />
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}
      {!view.loading && !view.child ? (
        <MobileConnect />
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-3 ${view.loading ? "animate-pulse" : ""}`}>
            {tiles.map((tile) => (
              <span key={tile.label} className="flex items-center gap-3 rounded-[20px] bg-surface p-3.5">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tile.tone}`}>
                  <Icon name={tile.icon} size={20} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <strong className="truncate font-heading text-[18px]/6 font-semibold text-ink">{tile.value}</strong>
                  <small className="truncate text-caption text-ink-secondary">{tile.label}</small>
                </span>
              </span>
            ))}
          </div>
          {points.length ? (
            <>
              <ScoreCard
                trend={parentHome.scoreTrend(points, view.now, 6)}
                delta={parentResults.delta(current.average, previous.average)}
                deltaLabel={t("results.thisMonth")}
                width={340}
                gradientId="results-mobile-fill"
              />
              <h2 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">{t("results.subjects")}</h2>
              <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
                {subjects.map((row) => {
                  const course = view.courseById.get(row.courseId);
                  const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${row.title}`);
                  const share = row.total ? row.submitted / row.total : 0;
                  return (
                    <li key={row.courseId} className="border-b border-line last:border-b-0">
                      <button type="button" className="flex w-full flex-col gap-3 px-4 py-4 text-left" onClick={() => navigate(ROUTES.parent.course(row.courseId))}>
                        <span className="flex w-full items-center gap-3">
                          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${look.tone}`}>
                            <Icon name={look.icon} size={22} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <strong className="truncate text-title-sm text-ink">{row.title}</strong>
                            <small className="text-body-xs text-ink-secondary">{t("mobile.results.submitted", { submitted: row.submitted, total: row.total })}</small>
                          </span>
                          <span className="flex shrink-0 flex-col items-end">
                            <strong className="font-heading text-[20px]/7 font-semibold text-ink">{row.average ?? "—"}</strong>
                            <small className="text-caption text-ink-tertiary">{t("results.average")}</small>
                          </span>
                        </span>
                        <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                          <span className={`block h-full rounded-full ${share >= 0.8 ? "bg-success" : "bg-brand"}`} style={{ width: `${share * 100}%` }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : view.loading ? null : (
            <MobileEmptyCard icon="bar-chart" title={t("results.empty.title")} description={t("results.empty.text")} />
          )}
        </>
      )}
    </div>
  );
}

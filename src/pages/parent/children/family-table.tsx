import { useTranslation } from "react-i18next";
import { parentFamily, type FamilyPeriod } from "@/modules/parent";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { visitWhen } from "./family-format";
import type { FamilyChild } from "./use-parent-family";

const PERIODS: FamilyPeriod[] = ["week", "month"];
const HEAD = "pb-3 text-left text-caption-strong tracking-wide text-ink-tertiary uppercase";
const CELL = "py-3 text-body-sm text-ink";

export function FamilyTable({
  rows,
  period,
  now,
  onPeriod,
}: {
  rows: FamilyChild[];
  period: FamilyPeriod;
  now: number;
  onPeriod: (period: FamilyPeriod) => void;
}) {
  const { t } = useTranslation("parent");

  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface px-6 py-5">
      <div className="flex items-center gap-4">
        <h2 className="min-w-0 flex-1 truncate text-title text-ink">
          {t(period === "week" ? "family.table.titleWeek" : "family.table.titleMonth")}
        </h2>
        <div role="tablist" className="flex shrink-0 items-center gap-1 rounded-full bg-subtle p-1">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={period === item}
              className={`flex h-8 items-center rounded-full px-4 text-body-sm font-medium transition-colors ${
                period === item ? "bg-brand text-on-action" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => onPeriod(item)}
            >
              {t(`family.table.${item}`)}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[15%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className={HEAD}>{t("family.table.child")}</th>
            <th className={HEAD}>{t("family.table.attendance")}</th>
            <th className={HEAD}>{t("family.table.homework")}</th>
            <th className={HEAD}>{t("family.table.score")}</th>
            <th className={HEAD}>{t("family.table.lastLesson")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ child, period: summary, lastVisit, loading }) => {
            const good = summary.attendance !== null && parentFamily.isGoodAttendance(summary.attendance);
            return (
              <tr key={child.id} className={loading ? "animate-pulse" : undefined}>
                <td className={CELL}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={child.name}
                      src={child.avatarUrl ?? undefined}
                      tone={child.avatarTone}
                      size="xs"
                      className="shrink-0 [&_.avatar]:size-8"
                    />
                    <strong className="truncate text-title-sm text-ink">{child.name}</strong>
                  </span>
                </td>
                <td className={CELL}>
                  {summary.attendance === null ? (
                    "—"
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption-strong ${
                        good ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"
                      }`}
                    >
                      <Icon name={good ? "trending-up" : "warning"} size={14} />
                      {summary.attendance}%
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  {summary.homework.total ? `${summary.homework.submitted} / ${summary.homework.total}` : "—"}
                </td>
                <td className={CELL}>{summary.score === null ? "—" : summary.score}</td>
                <td className={`${CELL} truncate`}>
                  {lastVisit
                    ? t("family.table.lastLessonValue", { when: visitWhen(lastVisit.at, now, t, true), course: lastVisit.course })
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

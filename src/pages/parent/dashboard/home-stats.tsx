import { useTranslation } from "react-i18next";
import { formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { hoursMinutes } from "./home-format";

export interface HomeStatsProps {
  now: number;
  month: { percent: number | null; attended: number; total: number; delta: number | null };
  score: { average: number | null; delta: number | null };
  homework: { total: number; submitted: number; remaining: number; dueSoon: unknown[] };
  minutes: number;
}

function Delta({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null || value === 0) return null;
  const up = value > 0;
  return (
    <span className={`rounded-full px-2 py-0.5 text-caption-strong ${up ? "bg-success-bg text-success-fg" : "bg-danger-bg text-error-text"}`}>
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function Tile({
  icon,
  tone,
  badge,
  label,
  value,
  hint,
}: {
  icon: string;
  tone: string;
  badge?: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-[20px] bg-surface p-4">
      <span className="flex items-start justify-between gap-2">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon name={icon} size={20} />
        </span>
        {badge}
      </span>
      <small className="mt-4 truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className="mt-1 font-heading text-[28px]/9 font-semibold text-ink">{value}</strong>
      <small className="mt-2 truncate text-caption text-ink-tertiary">{hint}</small>
    </article>
  );
}

export function HomeStats({ now, month, score, homework, minutes }: HomeStatsProps) {
  const { t } = useTranslation("parent");
  const monthName = formatLocalized(now, t("home.monthPattern"));
  return (
    <div className="grid grid-cols-4 gap-4">
      <Tile
        icon="event"
        tone="bg-accent-green-bg text-accent-green-fg"
        badge={<Delta value={month.delta} suffix="%" />}
        label={t("home.stats.attendance")}
        value={month.percent === null ? "—" : `${month.percent}%`}
        hint={
          month.total
            ? t("home.stats.attendanceSub", { month: monthName, attended: month.attended, total: month.total })
            : t("home.stats.attendanceEmpty")
        }
      />
      <Tile
        icon="emoji-events"
        tone="bg-accent-violet-bg text-accent-violet-fg"
        badge={<Delta value={score.delta} />}
        label={t("home.stats.score")}
        value={score.average === null ? "—" : String(score.average)}
        hint={score.average === null ? t("home.stats.scoreEmpty") : t("home.stats.scoreSub")}
      />
      <Tile
        icon="assignment"
        tone="bg-accent-saffron-bg text-accent-saffron-fg"
        badge={
          homework.remaining ? (
            <span className="rounded-full bg-warning-bg px-2 py-0.5 text-caption-strong text-warning-fg">
              {t("home.stats.homeworkLeft", { count: homework.remaining })}
            </span>
          ) : null
        }
        label={t("home.stats.homework")}
        value={homework.total ? `${homework.submitted} / ${homework.total}` : "—"}
        hint={
          !homework.total
            ? t("home.stats.homeworkEmpty")
            : homework.dueSoon.length
              ? t("home.stats.homeworkDue", { count: homework.dueSoon.length })
              : t("home.stats.homeworkNoDue")
        }
      />
      <Tile
        icon="schedule"
        tone="bg-accent-teal-bg text-accent-teal-fg"
        label={t("home.stats.time")}
        value={hoursMinutes(minutes, t, "home.duration")}
        hint={t("home.stats.timeSub")}
      />
    </div>
  );
}

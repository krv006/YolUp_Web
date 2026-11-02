import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { AttentionItem } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

const DAY_MS = 86_400_000;

export function AttentionCard({
  items,
  childId,
  now,
}: {
  items: AttentionItem[];
  childId: string;
  now: number;
}) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const today = new Date(now).toDateString();
  const tomorrow = new Date(now + DAY_MS).toDateString();

  return (
    <section className="flex flex-col gap-3">
      <strong className="text-title text-ink">{t("home.attention.title")}</strong>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        {items.length ? (
          items.map((item, index) => {
            let icon: string;
            let tone: string;
            let title: string;
            let meta: string;
            let open: () => void;
            if (item.kind === "homework") {
              const due = item.assignment.dueAt ?? "";
              const dueDay = new Date(due).toDateString();
              icon = "hourglass-empty";
              tone = "bg-accent-saffron-bg text-accent-saffron-fg";
              title =
                dueDay === today
                  ? t("home.attention.homeworkToday")
                  : dueDay === tomorrow
                    ? t("home.attention.homeworkTomorrow")
                    : t("home.attention.homeworkSoon");
              meta = `${item.assignment.title} · ${formatDayTime(due)}`;
              open = () => navigate(ROUTES.parent.homework);
            } else if (item.kind === "login") {
              icon = "shield";
              tone = "bg-danger-bg text-error-text";
              title = t("home.attention.login");
              meta = `${item.device} · ${formatDayTime(item.at)}`;
              open = () => navigate(ROUTES.parent.childLogins(childId));
            } else {
              icon = "emoji-events";
              tone = "bg-accent-blue-bg text-accent-blue-fg";
              title = t("home.attention.exam");
              meta = t("home.attention.examMeta", { title: item.exam.title });
              open = () => navigate(ROUTES.parent.exams);
            }
            return (
              <li key={`${item.kind}-${index}`} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-subtle"
                  onClick={open}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon name={icon} size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="truncate text-body font-semibold text-ink">{title}</strong>
                    <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
                  </span>
                  <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
                </button>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-7 text-center text-body-sm text-ink-secondary">{t("home.attention.empty")}</li>
        )}
      </ul>
    </section>
  );
}

const H = 120;
const PAD = 8;

export function ScoreCard({
  trend,
  delta,
  title,
  deltaLabel,
  width: W = 320,
  gradientId = "parent-score-fill",
}: {
  trend: Array<number | null>;
  delta: number | null;
  title?: string;
  deltaLabel?: string;
  width?: number;
  gradientId?: string;
}) {
  const { t } = useTranslation("parent");
  const points = trend
    .map((value, index) => ({ value, index }))
    .filter((point): point is { value: number; index: number } => point.value !== null);
  const values = points.map((point) => point.value);
  const min = values.length ? Math.max(0, Math.min(...values) - 1) : 0;
  const max = values.length ? Math.min(10, Math.max(...values) + 1) : 10;
  const x = (index: number) => PAD + (index * (W - PAD * 2)) / Math.max(1, trend.length - 1);
  const y = (value: number) => H - PAD - ((value - min) / Math.max(0.1, max - min)) * (H - PAD * 2);
  const line = points.map((point, i) => `${i ? "L" : "M"}${x(point.index)},${y(point.value)}`).join(" ");
  const area = points.length
    ? `${line} L${x(points[points.length - 1].index)},${H} L${x(points[0].index)},${H} Z`
    : "";
  const last = points[points.length - 1];

  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-5">
      <span className="flex items-center gap-2">
        <strong className="flex-1 text-title text-ink">{title ?? t("home.score.title")}</strong>
        {delta !== null && delta !== 0 ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-strong ${
              delta > 0 ? "bg-success-bg text-success-fg" : "bg-danger-bg text-error-text"
            }`}
          >
            <Icon name="trending-up" size={14} />
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        ) : null}
      </span>
      {points.length ? (
        <div className="flex flex-col gap-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full overflow-visible" role="img" aria-label={title ?? t("home.score.title")}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line key={ratio} x1={PAD} x2={W - PAD} y1={H * ratio} y2={H * ratio} stroke="var(--color-line)" strokeWidth="1" />
            ))}
            {points.length > 1 ? <path d={area} fill={`url(#${gradientId})`} /> : null}
            <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((point) => (
              <circle key={point.index} cx={x(point.index)} cy={y(point.value)} r={point === last ? 5 : 3.5} fill="var(--color-brand)" stroke="var(--color-surface)" strokeWidth="2" />
            ))}
            {last ? (
              <g transform={`translate(${Math.min(W - 40, x(last.index) - 18)}, ${Math.max(0, y(last.value) - 34)})`}>
                <rect width="36" height="22" rx="6" fill="var(--color-ink)" />
                <text x="18" y="15" textAnchor="middle" className="fill-surface text-[11px] font-semibold">
                  {last.value}
                </text>
              </g>
            ) : null}
          </svg>
          <span className="flex justify-between text-caption text-ink-tertiary">
            {trend.map((_, index) => (
              <span key={index}>{t("home.score.week", { n: index + 1 })}</span>
            ))}
          </span>
        </div>
      ) : (
        <p className="py-6 text-center text-body-sm text-ink-secondary">{t("home.score.empty")}</p>
      )}
    </section>
  );
}

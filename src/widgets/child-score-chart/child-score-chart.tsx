import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/shared/api";
import { isConsentRequired, SCORE_KINDS, scoreSeries, useChildScores, type ScoreKind, type ScoreRange } from "@/modules/parent";

const RANGES: ScoreRange[] = ["8w", "6m", "all"];
const SIZE = {
  wide: { width: 640, height: 220 },
  compact: { width: 300, height: 150 },
} as const;
const PAD = { top: 14, right: 12, bottom: 10, left: 26 };
const GRID = [0, 2.5, 5, 7.5, 10];

function periodLabel(start: string, monthly: boolean, months: string[]): string {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return "";
  if (monthly) return months[date.getMonth()] ?? "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface ChildScoreChartProps {
  childId: string | null;
  variant?: "wide" | "compact";
  title?: string;
}

export function ChildScoreChart({ childId, variant = "wide", title }: ChildScoreChartProps) {
  const { t } = useTranslation("parent");
  const [range, setRange] = useState<ScoreRange>("8w");
  const [kind, setKind] = useState<ScoreKind>("overall");
  const scores = useChildScores(childId, range);
  const { width: W, height: H } = SIZE[variant];
  const months = t("scores.monthsShort", { returnObjects: true }) as string[];
  const data = scores.data;
  const series = data ? scoreSeries(data, kind) : [];
  const step = series.length > 1 ? (W - PAD.left - PAD.right) / (series.length - 1) : 0;
  const x = (index: number) => (series.length > 1 ? PAD.left + index * step : (W + PAD.left - PAD.right) / 2);
  const y = (value: number) => PAD.top + (1 - value / 10) * (H - PAD.top - PAD.bottom);
  const points = series
    .map((value, index) => (value === null ? null : { index, value }))
    .filter((point): point is { index: number; value: number } => point !== null);
  const line = points.map((point, i) => `${i ? "L" : "M"}${x(point.index)},${y(point.value)}`).join(" ");
  const area = points.length > 1
    ? `${line} L${x(points[points.length - 1].index)},${H - PAD.bottom} L${x(points[0].index)},${H - PAD.bottom} Z`
    : "";
  const last = points[points.length - 1];
  const labelEvery = Math.max(1, Math.ceil(series.length / (variant === "wide" ? 12 : 6)));
  const locked =
    scores.isError && (isConsentRequired(scores.error) || (scores.error instanceof AppError && scores.error.status === 403));
  const average = data?.summary[kind] ?? null;
  const gradientId = `child-score-${variant}`;

  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="min-w-0 flex-1 text-title text-ink">{title ?? t("scores.title")}</strong>
        {average !== null ? (
          <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-caption-strong text-brand">
            {t("scores.average", { value: average })}
          </span>
        ) : null}
      </div>

      <div className={`flex gap-2 ${variant === "wide" ? "flex-row flex-wrap items-center justify-between" : "flex-col"}`}>
        <div className="grid grid-cols-4 gap-1 rounded-full bg-subtle p-1" role="tablist" aria-label={t("scores.kindLabel")}>
          {SCORE_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              className={`h-8 truncate rounded-full px-2.5 text-caption-strong transition-colors ${
                kind === item ? "bg-surface text-ink shadow-xs" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => setKind(item)}
            >
              {variant === "compact" ? t(`scores.kindsShort.${item}`) : t(`scores.kinds.${item}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-subtle p-1" role="tablist" aria-label={t("scores.rangeLabel")}>
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              className={`h-8 rounded-full px-2.5 text-caption-strong transition-colors ${
                range === item ? "bg-brand text-on-action" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => setRange(item)}
            >
              {t(`scores.ranges.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {locked ? (
        <p className="py-6 text-center text-body-sm text-ink-secondary">{t("scores.locked")}</p>
      ) : scores.isLoading ? (
        <div className="animate-pulse rounded-xl bg-skeleton" style={{ aspectRatio: `${W} / ${H}` }} aria-hidden="true" />
      ) : points.length ? (
        <div className="flex flex-col gap-1.5">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={t("scores.chartAria", { kind: t(`scores.kinds.${kind}`) })}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {GRID.map((value) => (
              <g key={value}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} stroke="var(--color-line)" strokeWidth="1" />
                <text x={PAD.left - 6} y={y(value) + 3.5} textAnchor="end" className="fill-ink-tertiary text-[10px]">
                  {value}
                </text>
              </g>
            ))}
            {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
            <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((point) => (
              <circle
                key={point.index}
                cx={x(point.index)}
                cy={y(point.value)}
                r={point === last ? 5 : 3.5}
                fill="var(--color-brand)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              >
                <title>{`${periodLabel(data?.periods[point.index]?.start ?? "", data?.periodType === "month", months)}: ${point.value}`}</title>
              </circle>
            ))}
            {last ? (
              <g transform={`translate(${Math.min(W - 40, Math.max(PAD.left, x(last.index) - 18))}, ${Math.max(0, y(last.value) - 32)})`}>
                <rect width="36" height="22" rx="6" fill="var(--color-ink)" />
                <text x="18" y="15" textAnchor="middle" className="fill-surface text-[11px] font-semibold">
                  {last.value}
                </text>
              </g>
            ) : null}
          </svg>
          <div className="relative h-4 text-caption text-ink-tertiary" aria-hidden="true">
            {(data?.periods ?? []).map((period, index) =>
              index % labelEvery === 0 || index === series.length - 1 ? (
                <span
                  key={period.start}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${(x(index) / W) * 100}%` }}
                >
                  {periodLabel(period.start, data?.periodType === "month", months)}
                </span>
              ) : null
            )}
          </div>
        </div>
      ) : (
        <p className="py-6 text-center text-body-sm text-ink-secondary">{t("scores.empty")}</p>
      )}

      {variant === "wide" && data && !locked ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {SCORE_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              className={`flex flex-col rounded-xl px-3 py-2.5 text-left transition-colors ${
                kind === item ? "bg-brand-subtle" : "bg-subtle hover:text-brand"
              }`}
              onClick={() => setKind(item)}
            >
              <small className="text-caption text-ink-secondary">{t(`scores.kinds.${item}`)}</small>
              <strong className="font-numeric text-title text-ink">{data.summary[item] ?? "—"}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

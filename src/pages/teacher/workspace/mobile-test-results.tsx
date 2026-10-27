import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import {
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileTitleHeader,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

export interface MobileResultRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  attempts: number;
  percent: number | null;
  durationSeconds: number | null;
}

export interface MobileTestResultsProps {
  eyebrow: string;
  title: string;
  stats: Array<{ id: string; value: ReactNode; label: ReactNode; tone: string }>;
  rows: MobileResultRow[];
  loading: boolean;
  onBack: () => void;
  onAttempts: () => void;
}

function percentTone(value: number): string {
  if (value >= 90) return "text-success-fg";
  if (value >= 70) return "text-ink";
  return "text-warning-fg";
}

export function MobileTestResults({ eyebrow, title, stats, rows, loading, onBack, onAttempts }: MobileTestResultsProps) {
  const { t } = useTranslation("quiz");

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink">
      <header className="flex h-11 shrink-0 items-center justify-between">
        <button type="button" className={mobileRoundButton} aria-label={t("tests.mobile.back")} onClick={onBack}>
          <Icon name="chevron-left" size={22} />
        </button>
        <button type="button" className={mobileRoundButton} aria-label={t("tests.attempts")} onClick={onAttempts}>
          <Icon name="assign" size={22} />
        </button>
      </header>

      <div className="mt-3.5">
        <MobileTitleHeader eyebrow={eyebrow} title={title} />
      </div>

      <div className="mt-5.5 grid shrink-0 grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.id} className="flex h-[63px] min-w-0 flex-col justify-center rounded-lg bg-surface px-3">
            <strong className={`truncate text-[20px] leading-6 font-semibold ${stat.tone}`}>{stat.value}</strong>
            <small className="truncate text-body-xs text-ink-secondary">{stat.label}</small>
          </div>
        ))}
      </div>

      {loading ? (
        <MobileListSkeleton card rows={4} className="mt-5" />
      ) : rows.length ? (
        <MobileListCard className="mt-5">
          {rows.map((row) => (
            <MobileListRow
              key={row.id}
              chevron={false}
              leading={
                <Avatar name={row.name} src={row.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-11" />
              }
              title={row.name}
              subtitle={
                row.attempts
                  ? [
                      t("results.mobile.attempt", { count: row.attempts }),
                      row.durationSeconds ? t("results.mobile.minutes", { count: Math.max(1, Math.round(row.durationSeconds / 60)) }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : t("results.mobile.notSolved")
              }
              trailing={
                row.percent === null ? (
                  <span className="h-0.5 w-4 shrink-0 rounded-full bg-ink-secondary" aria-label={t("results.mobile.notSolved")} />
                ) : (
                  <strong className={`shrink-0 font-heading text-title ${percentTone(row.percent)}`}>{row.percent}%</strong>
                )
              }
            />
          ))}
        </MobileListCard>
      ) : (
        <p className="mt-5 rounded-xl bg-surface px-5 py-10 text-center text-body-sm text-ink-secondary">
          {t("results.empty")}
        </p>
      )}
    </main>
  );
}

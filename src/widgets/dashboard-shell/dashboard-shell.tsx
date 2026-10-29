import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "@/modules/notification";
import { Icon } from "@/shared/ui/icon";
import { useOpenNotificationLink } from "@/widgets/notification-link";

export interface DashboardShellProps {
  user: string;
  dateLine: string;
  online: boolean;
  approved: boolean;
  children: ReactNode;
}

export function DashboardShell({
  user,
  dateLine,
  online,
  approved,
  children,
}: DashboardShellProps) {
  const { t } = useTranslation("dashboard");
  const openLink = useOpenNotificationLink();

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-canvas bg-page-gradient">
      <div className="flex flex-col gap-6 px-8 py-7">
        <header className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <small className="text-caption text-ink-tertiary">{dateLine}</small>
            <h1 className="truncate font-heading text-[26px]/9 font-semibold text-ink">
              {t("header.greeting", { name: user.split(" ")[0] || user })}
            </h1>
          </div>

          <NotificationBell onOpenLink={openLink} className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle" />
        </header>

        {!online ? (
          <p className="flex items-center gap-3 rounded-2xl bg-surface-inverse px-5 py-4 text-body-sm text-ink-inverse">
            <Icon name="wifi" size={20} className="shrink-0" />
            {t("banner.offline")}
          </p>
        ) : null}

        {!approved ? (
          <p className="flex items-center gap-3 rounded-2xl bg-warning-bg px-5 py-4 text-body-sm text-warning-fg">
            <Icon name="warning" size={20} className="shrink-0" />
            {t("banner.notApproved")}
          </p>
        ) : null}

        {children}
      </div>
    </main>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <h2 className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">{title}</h2>
      {actionLabel && onAction ? (
        <button type="button" className="shrink-0 text-label text-brand" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function StatCard({
  value,
  label,
  hint,
  tone = "text-ink",
}: {
  value: string;
  label: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="text-caption text-ink-secondary">{label}</small>
      <strong className={`font-heading text-numeric-lg font-numeric ${tone}`}>{value}</strong>
      <small className="text-caption text-ink-tertiary">{hint}</small>
    </div>
  );
}

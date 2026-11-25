import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/modules/notification";
import { Icon } from "@/shared/ui/icon";
import { useOpenNotificationLink } from "@/widgets/notification-link";

export interface WorkspaceShellProps {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  backTo?: string;
  onBack?: () => void;
  children: ReactNode;
}

export function WorkspaceShell({ eyebrow, title, action, backTo, onBack, children }: WorkspaceShellProps) {
  const openLink = useOpenNotificationLink();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (onBack) return onBack();
    if (location.key !== "default") navigate(-1);
    else if (backTo) navigate(backTo, { replace: true });
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-canvas bg-page-gradient">
      <div className="flex flex-col gap-5 px-8 py-7">
        <header className="mb-[3px] flex flex-wrap items-center gap-4">
          {backTo || onBack ? (
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-subtle"
              aria-label={t("actions.back")}
              title={t("actions.back")}
              onClick={goBack}
            >
              <Icon name="arrow-back" size={20} />
            </button>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <small className="truncate text-body-xs text-ink-secondary">{eyebrow}</small>
            <h1 className="truncate font-heading text-[26px]/9 font-semibold text-ink">{title}</h1>
          </div>

          <NotificationBell onOpenLink={openLink} className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle" />

          {action}
        </header>

        {children}
      </div>
    </main>
  );
}

export const workspaceAction =
  "flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-button whitespace-nowrap text-ink-inverse transition-colors hover:bg-brand-strong";

export const workspaceGhostAction =
  "flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button whitespace-nowrap text-ink transition-colors hover:bg-subtle";

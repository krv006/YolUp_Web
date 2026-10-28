import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useIsStudent } from "@/modules/auth";
import { NotificationBell } from "@/modules/notification";
import { Icon } from "@/shared/ui/icon";
import { GlobalSearchDialog } from "@/widgets/global-search";
import { useOpenNotificationLink } from "@/widgets/notification-link";

export interface WorkspaceShellProps {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function WorkspaceShell({ eyebrow, title, action, children }: WorkspaceShellProps) {
  const { t } = useTranslation("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const student = useIsStudent();
  const openLink = useOpenNotificationLink();

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-canvas bg-page-gradient">
      <div className="flex flex-col gap-5 px-8 py-7">
        <header className="mb-[3px] flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <small className="truncate text-body-xs text-ink-secondary">{eyebrow}</small>
            <h1 className="truncate font-heading text-[26px]/9 font-semibold text-ink">{title}</h1>
          </div>

          <button
            type="button"
            className="flex h-10 w-full max-w-80 items-center gap-2.5 rounded-full bg-surface px-4 text-body-sm text-ink-tertiary transition-colors hover:bg-subtle"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="search" size={18} className="shrink-0 text-icon-tertiary" />
            <span className="min-w-0 flex-1 truncate text-left">
              {student ? t("student:home.searchPlaceholder") : t("header.searchPlaceholder")}
            </span>
            <kbd className="shrink-0 rounded-sm bg-subtle px-2 py-0.5 text-caption text-ink-tertiary">
              ⌘ K
            </kbd>
          </button>

          <NotificationBell onOpenLink={openLink} className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle" />

          {action}
        </header>

        {children}
      </div>

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </main>
  );
}

export const workspaceAction =
  "flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-button whitespace-nowrap text-ink-inverse transition-colors hover:bg-brand-strong";

export const workspaceGhostAction =
  "flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button whitespace-nowrap text-ink transition-colors hover:bg-subtle";

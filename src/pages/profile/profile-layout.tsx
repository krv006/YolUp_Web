import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth, useIsStudent } from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { CardsSkeleton } from "@/shared/ui/page-skeleton";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { LogoutDialog, SwitchAccountDialog } from "./profile-dialogs";
import { ProfilePage } from "./profile-page";

const ITEMS = [
  { to: "personal", icon: "person", labelKey: "page.personalTitle", titleKey: "page.title" },
  { to: "account", icon: "shield", labelKey: "page.accountTitle", titleKey: "page.accountTitle" },
  { to: "system", icon: "settings", labelKey: "page.systemTitle", titleKey: "page.systemTitle" },
  { to: "ratings", icon: "star", labelKey: "page.ratingsTitle", titleKey: "page.ratingsTitle" },
  {
    to: "certificates",
    icon: "workspace-premium",
    labelKey: "page.certificatesTitle",
    titleKey: "page.certificatesTitle",
  },
  { to: "logins", icon: "history", labelKey: "page.loginsTitle", titleKey: "page.loginsTitle" },
];

const HELP = { to: "help", icon: "help", labelKey: "page.helpTitle", titleKey: "page.helpTitle" };

const NAV_ITEM =
  "flex h-11 items-center gap-3 rounded-xl px-3 text-body-sm font-medium transition-colors";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `${NAV_ITEM} ${isActive ? "bg-brand-subtle text-brand" : "text-ink hover:bg-subtle"}`;

export function ProfileLayout() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const { user } = useAuth();
  const student = useIsStudent();
  const { pathname } = useLocation();
  const isCompact = useIsCompact();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (isCompact) return <Outlet />;

  const active = [...ITEMS, HELP].find((item) => pathname.endsWith(`/${item.to}`));

  return (
    <WorkspaceShell
      eyebrow={`${student ? tn("roles.student") : (user?.name ?? "")}${user?.username ? ` · @${user.username}` : ""}`}
      title={t(active?.titleKey ?? "page.title")}
    >
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,640px)] lg:items-start">
        <nav className="flex flex-col rounded-2xl bg-surface p-2.5" aria-label={t("page.title")}>
          {ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              <Icon name={item.icon} size={20} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
            </NavLink>
          ))}

          <button
            type="button"
            className={`${NAV_ITEM} text-ink hover:bg-subtle`}
            onClick={() => setSwitchOpen(true)}
          >
            <Icon name="group" size={20} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{t("page.switchAccount")}</span>
          </button>

          <NavLink to={HELP.to} className={navClass}>
            <Icon name={HELP.icon} size={20} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t(HELP.labelKey)}</span>
          </NavLink>

          <button
            type="button"
            className={`${NAV_ITEM} text-error-text hover:bg-danger-bg`}
            onClick={() => setLogoutOpen(true)}
          >
            <Icon name="logout" size={20} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{t("page.logout")}</span>
          </button>
        </nav>

        <Suspense fallback={<CardsSkeleton />}>
          <Outlet />
        </Suspense>
      </div>

      <SwitchAccountDialog open={switchOpen} onOpenChange={setSwitchOpen} />
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </WorkspaceShell>
  );
}

export function ProfileIndexRoute() {
  const isCompact = useIsCompact();
  if (isCompact) return <ProfilePage />;
  return <Navigate to="personal" replace />;
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import logoUrl from "@/shared/assets/y-logo.svg";
import { useAuth } from "@/modules/auth";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { ChildSwitcher } from "./child-switcher";
import { ParentAccountMenu } from "./parent-account-menu";

const LINK_BASE = "flex h-11 items-center gap-3 rounded-xl px-3 text-label-lg transition-colors";
const LINK_IDLE = "text-ink-secondary hover:bg-subtle hover:text-ink";
const LINK_ACTIVE = "bg-brand-subtle text-brand";

const ITEMS = [
  { id: "dashboard", icon: "home", to: ROUTES.parent.dashboard, extra: [] as string[] },
  { id: "children", icon: "group", to: ROUTES.parent.children, extra: [] },
  { id: "attendance", icon: "event", to: ROUTES.parent.attendance, extra: [] },
  { id: "homework", icon: "assignment", to: ROUTES.parent.homework, extra: [] },
  { id: "results", icon: "bar-chart", to: ROUTES.parent.grades, extra: [ROUTES.parent.exams] },
];

export function ParentSidebar() {
  const { t } = useTranslation("parent");
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [accountOpen, setAccountOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const open = (homework.data ?? []).filter(
    (item) => !item.mySubmission && (!item.dueAt || Date.parse(item.dueAt) >= now)
  ).length;

  return (
    <aside className="flex h-full w-(--layout-sidebar) shrink-0 flex-col gap-6 border-r border-line-subtle bg-surface px-4 pt-6 pb-5 font-body text-ink">
      <NavLink to={ROUTES.parent.dashboard} className="flex items-center gap-2 px-3">
        <img className="size-8" src={logoUrl} alt="" />
        <span className="font-heading text-h3 text-ink">YolUp</span>
      </NavLink>

      <ChildSwitcher />

      <nav className="-mt-0.5 flex flex-col gap-1.5" aria-label={t("shell.navLabel")}>
        {ITEMS.map((item) => {
          const extraActive = item.extra.some((path) => pathname.startsWith(path));
          return (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `${LINK_BASE} ${isActive || extraActive ? LINK_ACTIVE : LINK_IDLE}`}
            >
              <Icon name={item.icon} size={22} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t(`shell.nav.${item.id}`)}</span>
              {item.id === "homework" && open ? (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-caption-strong text-ink-inverse">
                  {open}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <span className="min-h-0 flex-1" aria-hidden="true" />

      <ParentAccountMenu open={accountOpen} onOpenChange={setAccountOpen}>
      <button
        type="button"
        aria-label={t("shell.openAccount")}
        className="flex items-center gap-2.5 rounded-2xl bg-subtle py-2.5 pr-[9px] pl-2.5 text-left transition-colors hover:bg-muted"
        onClick={() => setAccountOpen((current) => !current)}
      >
        <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-[38px]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-body-xs font-semibold tracking-tight text-ink">{user?.name}</strong>
          <small className="truncate text-caption font-normal text-ink-secondary">{t("shell.role")}</small>
        </span>
        <Icon name="settings" size={18} className="-ml-1.5 shrink-0 text-icon-secondary" />
      </button>
      </ParentAccountMenu>
    </aside>
  );
}

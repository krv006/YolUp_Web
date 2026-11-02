import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";

const TABS = [
  { id: "children", icon: "group", to: ROUTES.parent.children, extra: [] as string[] },
  { id: "attendance", icon: "event", to: ROUTES.parent.attendance, extra: [] },
  { id: "home", icon: "home", to: ROUTES.parent.dashboard, extra: [] },
  { id: "homework", icon: "assignment", to: ROUTES.parent.homework, extra: [] },
  { id: "results", icon: "bar-chart", to: ROUTES.parent.grades, extra: [ROUTES.parent.exams] },
] as const;

export function ParentTabBar() {
  const { t } = useTranslation("parent");
  const { pathname } = useLocation();
  const { selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [now] = useState(() => Date.now());
  const open = (homework.data ?? []).filter(
    (item) => item.status !== "draft" && !item.mySubmission && (!item.dueAt || Date.parse(item.dueAt) >= now)
  ).length;

  return (
    <nav
      className="fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-30 flex h-17 items-stretch rounded-[28px] bg-surface/95 px-2 font-body shadow-lg backdrop-blur"
      aria-label={t("shell.navLabel")}
    >
      {TABS.map((tab) => {
        const active = [tab.to, ...tab.extra].some((path) => pathname === path || pathname.startsWith(`${path}/`));
        if (tab.id === "home")
          return (
            <NavLink key={tab.id} to={tab.to} className="flex flex-1 flex-col items-center" aria-current={active ? "page" : undefined}>
              <span className="-mt-0.5 grid size-14 place-items-center rounded-full bg-brand text-on-action shadow-md">
                <Icon name={tab.icon} size={26} />
              </span>
              <span className={`text-[11px] leading-3.5 font-medium ${active ? "text-brand" : "text-ink"}`}>{t("mobile.tabs.home")}</span>
            </NavLink>
          );
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            className={`flex flex-1 flex-col items-center gap-1 pt-2 ${active ? "text-brand" : "text-ink"}`}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`relative grid h-8 w-14 place-items-center rounded-full transition-colors ${
                active ? "bg-surface shadow-[0_2px_12px_rgb(69_103_245/0.2)]" : ""
              }`}
            >
              <Icon name={tab.icon} size={24} />
              {tab.id === "homework" && open ? (
                <i className="absolute -top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-semibold text-on-action not-italic">
                  {open}
                </i>
              ) : null}
            </span>
            <span className="text-[11px] leading-3.5 font-medium">{t(`mobile.tabs.${tab.id}`)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

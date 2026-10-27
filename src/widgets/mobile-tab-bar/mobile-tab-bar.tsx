import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { useConversations } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";

interface TabItem {
  id: "workspace" | "schedule" | "home" | "chat" | "profile";
  icon: string;
  to: string;
}

const TABS: TabItem[] = [
  { id: "workspace", icon: "nav-workspace", to: ROUTES.teacher.workspace },
  { id: "schedule", icon: "nav-calendar", to: ROUTES.teacher.schedule },
  { id: "home", icon: "home", to: ROUTES.teacher.dashboard },
  { id: "chat", icon: "nav-chat", to: ROUTES.teacher.chats },
  { id: "profile", icon: "nav-profile", to: ROUTES.teacher.profile },
];

export function MobileTabBar() {
  const { t } = useTranslation("nav");
  const { pathname } = useLocation();
  const { data = [] } = useConversations("teacher");
  const unread = data.filter((item) => item.unreadCount > 0).length;

  return (
    <nav
      className="fixed inset-x-4 bottom-[max(30px,env(safe-area-inset-bottom))] z-30 flex h-17 items-stretch rounded-[28px] bg-surface px-2 font-body shadow-lg lg:hidden"
      aria-label={t("rail.sectionsLabel")}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);

        if (tab.id === "home")
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className="flex flex-1 flex-col items-center"
              aria-current={active ? "page" : undefined}
            >
              <span className="-mt-0.5 grid size-14 place-items-center rounded-full bg-brand text-on-action shadow-md">
                <Icon name={tab.icon} size={26} />
              </span>
              <span
                className={`text-[11px] leading-3.5 font-medium ${active ? "text-brand" : "text-ink"}`}
              >
                {t(`tabs.${tab.id}`)}
              </span>
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
              <Icon name={tab.icon} size={27} />
              {tab.id === "chat" && unread ? (
                <i className="absolute -top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-semibold text-on-action not-italic">
                  {unread}
                </i>
              ) : null}
            </span>
            <span className="text-[11px] leading-3.5 font-medium">{t(`tabs.${tab.id}`)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

import { useTranslation } from "react-i18next";
import { useNavigate, useResolvedPath } from "react-router-dom";
import logoUrl from "@/shared/assets/y-logo.svg";
import { Icon } from "@/shared/ui/icon";
import type { ConversationRole } from "@/shared/types";
import { useConversations } from "../model/use-conversations";

export type ConversationSection = "chat" | "schedule" | "workspace";

type SectionItem = {
  id: ConversationSection;
  icon: string;
  path: string;
};

const SECTIONS: SectionItem[] = [
  { id: "chat", icon: "nav-chat", path: "" },
  { id: "schedule", icon: "nav-calendar", path: "/schedule" },
  { id: "workspace", icon: "nav-workspace", path: "/workspace" },
];

const ITEM_BASE =
  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-caption transition-colors lg:h-12 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-label";
const ITEM_ACTIVE = "bg-action-subtle text-action font-semibold";
const ITEM_IDLE = "text-ink-secondary hover:bg-subtle hover:text-ink";

export interface ConversationRailProps {
  role: ConversationRole;
  section: ConversationSection;
  onOpenMenu: () => void;
}

export function ConversationRail({ role, section, onOpenMenu }: ConversationRailProps) {
  const { t } = useTranslation("nav");
  const navigate = useNavigate();
  const { data = [] } = useConversations(role);
  const basePath = role === "teacher" ? "/teacher/chats" : "/student/chats";
  const chatsPath = useResolvedPath(basePath).pathname;

  const unreadChats = data.filter((conversation) => conversation.unreadCount > 0).length;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch gap-1 border-t border-line bg-surface px-2 shadow-nav-top lg:static lg:z-auto lg:h-full lg:w-(--layout-sidebar) lg:shrink-0 lg:flex-col lg:items-stretch lg:border-t-0 lg:border-r lg:px-4 lg:py-6 lg:shadow-none"
      aria-label={t("rail.sectionsLabel")}
    >
      <span className="mb-6 hidden items-center px-3 lg:flex">
        <img className="size-8" src={logoUrl} alt="YolUp" />
      </span>

      {SECTIONS.map((item) => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            className={`${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(`${chatsPath}${item.path}`)}
          >
            <span className="relative">
              <Icon name={item.icon} size={24} />
              {item.id === "chat" && unreadChats ? (
                <i className="absolute -top-1 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[11px] leading-none font-semibold text-ink-inverse not-italic">
                  {unreadChats}
                </i>
              ) : null}
            </span>
            <span className="truncate">{t(`titles.${item.id}`)}</span>
          </button>
        );
      })}

      <button
        className={`${ITEM_BASE} ${ITEM_IDLE}`}
        onClick={onOpenMenu}
        aria-label={t("rail.openProfileMenu")}
      >
        <Icon name="nav-profile" size={24} />
        <span className="truncate">{t("titles.profile")}</span>
      </button>
    </nav>
  );
}

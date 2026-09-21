import { CalendarDays, LayoutGrid, Menu, MessagesSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useResolvedPath } from "react-router-dom";
import logoUrl from "@/shared/assets/y-logo.svg";
import type { ConversationRole } from "@/shared/types";
import { useConversations } from "../model/use-conversations";

export type ConversationSection = "chat" | "schedule" | "workspace";

type SectionItem = {
  id: ConversationSection;
  icon: typeof MessagesSquare;
  path: string;
};

const SECTIONS: SectionItem[] = [
  { id: "chat", icon: MessagesSquare, path: "" },
  { id: "schedule", icon: CalendarDays, path: "/schedule" },
  { id: "workspace", icon: LayoutGrid, path: "/workspace" },
];

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
    <nav className="conversation-rail" aria-label={t("rail.sectionsLabel")}>
      <span className="conversation-rail-logo">
        <img src={logoUrl} alt="YolUp" />
      </span>

      <button
        className="conversation-rail-menu"
        onClick={onOpenMenu}
        aria-label={t("rail.openProfileMenu")}
      >
        <Menu size={24} />
      </button>

      {SECTIONS.map((item) => {
        const Icon = item.icon;
        const active = section === item.id;
        return (
          <button
            key={item.id}
            className={active ? "is-active" : ""}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(`${chatsPath}${item.path}`)}
          >
            <Icon size={24} />
            <span>{t(`rail.${item.id}`)}</span>
            {item.id === "chat" && unreadChats ? (
              <i className="conversation-rail-badge">{unreadChats}</i>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

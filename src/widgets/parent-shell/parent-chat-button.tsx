import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { countUnreadChats, useConversations } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";

export function ParentChatButton() {
  const { t } = useTranslation("parent");
  const unread = countUnreadChats(useConversations("parent").data ?? [], "all");
  return (
    <Link
      to={ROUTES.parent.chats}
      aria-label={unread ? t("chats.openWithUnread", { count: unread }) : t("chats.title")}
      className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
    >
      <Icon name="chat-outline" size={22} />
      {unread ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-ink-inverse">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

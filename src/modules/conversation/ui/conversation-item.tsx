import { UsersRound, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Avatar } from "@/shared/ui/legacy";
import { formatConversationTime } from "@/shared/lib";
import type { Conversation } from "@/shared/types";

export interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  basePath?: string;
  live?: boolean;
}

export function ConversationItem({
  conversation,
  active,
  basePath = "/teacher/chats",
  live = false,
}: ConversationItemProps) {
  const { t } = useTranslation("chat");
  const unread = conversation.unreadCount > 0;

  return (
    <Link
      className={`flex h-[82px] shrink-0 items-center gap-3.5 rounded-xl border p-4 transition-colors ${
        active ? "border-transparent bg-action-subtle" : "border-line bg-surface hover:bg-subtle"
      }`}
      to={`${basePath}/${conversation.id}`}
    >
      <span className="relative shrink-0">
        <Avatar
          name={conversation.title}
          tone={conversation.avatarTone}
          src={conversation.imageUrl}
          size="lg"
          status={conversation.type === "direct" ? conversation.status : undefined}
        />
        {live && (
          <span
            className="absolute -inset-0.5 rounded-[16px] ring-2 ring-error"
            aria-hidden="true"
          />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <strong className="min-w-0 flex-1 truncate text-title text-ink">
            {conversation.title}
          </strong>
          <time
            className={`shrink-0 font-numeric text-caption ${
              unread ? "text-action" : "text-ink-tertiary"
            }`}
          >
            {formatConversationTime(conversation.updatedAt)}
          </time>
        </span>

        <span className="flex items-center gap-2">
          {live ? (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-body-sm text-error">
              <Video size={13} aria-hidden="true" />
              {t("item.liveNow")}
            </span>
          ) : (
            <span
              className={`flex min-w-0 flex-1 items-center gap-1.5 truncate text-body-sm ${
                conversation.typing ? "text-action" : "text-ink-secondary"
              }`}
            >
              {conversation.type === "group" && (
                <UsersRound size={13} className="shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">
                {conversation.typing ? t("item.typing") : conversation.lastMessage}
              </span>
            </span>
          )}
          {unread && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-action px-1.5 font-numeric text-[11px] leading-none font-semibold text-ink-inverse">
              {conversation.unreadCount}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

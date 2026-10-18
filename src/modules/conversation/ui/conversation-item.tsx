import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { formatConversationTime } from "@/shared/lib";
import type { Conversation } from "@/shared/types";

export interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  basePath?: string;
  live?: boolean;
  muted?: boolean;
  pinned?: boolean;
  onOpenActions?: (conversation: Conversation) => void;
}

export function ConversationItem({
  conversation,
  active,
  basePath = "/teacher/chats",
  live = false,
  muted = false,
  pinned = false,
  onOpenActions,
}: ConversationItemProps) {
  const { t } = useTranslation("chat");
  const unread = conversation.unreadCount > 0;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startHold() {
    if (!onOpenActions) return;
    holdTimer.current = setTimeout(() => onOpenActions(conversation), 500);
  }

  function cancelHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  return (
    <Link
      className={`flex h-[82px] shrink-0 items-center gap-3.5 rounded-xl border p-4 transition-colors ${
        active ? "border-transparent bg-action-subtle" : "border-line bg-surface hover:bg-subtle"
      }`}
      to={`${basePath}/${conversation.id}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(event) => {
        if (!onOpenActions) return;
        event.preventDefault();
        onOpenActions(conversation);
      }}
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
          {pinned ? <Icon name="pin" size={14} className="shrink-0 text-ink-tertiary" /> : null}
          {muted ? <Icon name="volume" size={14} className="shrink-0 text-ink-tertiary" /> : null}
          <time
            className={`shrink-0 font-numeric text-caption ${
              unread && !muted ? "text-action" : "text-ink-tertiary"
            }`}
          >
            {formatConversationTime(conversation.updatedAt)}
          </time>
        </span>

        <span className="flex items-center gap-2">
          {live ? (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-body-sm text-error">
              <Icon name="camera" size={14} />
              {t("item.liveNow")}
            </span>
          ) : (
            <span
              className={`flex min-w-0 flex-1 items-center gap-1.5 truncate text-body-sm ${
                conversation.typing ? "text-action" : "text-ink-secondary"
              }`}
            >
              {conversation.type === "group" && (
                <Icon name="groups" size={14} className="shrink-0" />
              )}
              <span className="truncate">
                {conversation.typing ? t("item.typing") : conversation.lastMessage}
              </span>
            </span>
          )}
          {unread && (
            <span
              className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 font-numeric text-[11px] leading-none font-semibold text-ink-inverse ${
                muted ? "bg-ink-tertiary" : "bg-action"
              }`}
            >
              {conversation.unreadCount}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

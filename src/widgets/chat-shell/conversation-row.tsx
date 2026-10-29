import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/modules/auth";
import { isOwnLastMessage, lastMessageBody } from "@/modules/conversation";
import { formatMessageTime } from "@/shared/lib";
import type { Conversation } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";

function preview(conversation: Conversation, mine: boolean, youLabel: string, body: string): string {
  if (!conversation.lastMessage) return "";
  const sender = conversation.lastSender;
  if (!sender) return body;
  return `${mine ? youLabel : sender}: ${body}`;
}

function listTime(value: string, yesterday: string, weekdays: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((start.getTime() - date.getTime()) / 86_400_000) + 1;
  if (date.getTime() >= start.getTime()) return formatMessageTime(date);
  if (diffDays <= 1) return yesterday;
  if (diffDays < 7) return weekdays[date.getDay()] ?? "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function ConversationRowBody({ conversation }: { conversation: Conversation }) {
  const { t } = useTranslation("chat");
  const user = useCurrentUser();
  const weekdays = t("listTime.weekdays", { returnObjects: true }) as string[];
  const mine = isOwnLastMessage(conversation, user);
  const body = lastMessageBody(conversation, {
    voice: t("panel.voiceMessage"),
    image: t("panel.imageMessage"),
    video: t("panel.videoMessage"),
  });

  return (
    <>
    {conversation.type === "group" ? (
      <GroupTile
        name={conversation.title}
        tone={conversation.avatarTone}
        src={conversation.imageUrl}
        className="size-12 rounded-lg text-title-sm"
      />
    ) : (
      <Avatar
        name={conversation.title}
        tone={conversation.avatarTone}
        src={conversation.imageUrl ?? undefined}
        size="lg"
        status={conversation.status === "online" ? "online" : undefined}
        className="[&_.avatar]:size-12"
      />
    )}

    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <strong className="truncate text-title text-ink">
        {conversation.title}
      </strong>
      {conversation.typing ? (
        <small className="truncate text-body-sm text-brand">
          {conversation.typingKind === "voice"
            ? t("panel.recordingVoice", { name: conversation.typingName ?? "" })
            : t("panel.typing", { name: conversation.typingName ?? "" })}
        </small>
      ) : (
        <small
          className={`flex min-w-0 items-center gap-1 text-body-sm ${
            conversation.unreadCount ? "text-ink" : "text-ink-secondary"
          }`}
        >
          {mine ? <Icon name="done-all" size={16} className="shrink-0 text-brand" /> : null}
          <span className="truncate">{preview(conversation, mine, t("panel.you"), body)}</span>
        </small>
      )}
    </span>

    <span className="flex shrink-0 flex-col items-end gap-1">
      <span className="flex items-center gap-1">
        {conversation.isPinned ? (
          <Icon name="pin" size={14} className="text-icon-secondary" />
        ) : null}
        <small
          className={`text-caption ${
            conversation.unreadCount ? "text-brand" : "text-ink-secondary"
          }`}
        >
          {conversation.updatedAt
          ? listTime(conversation.updatedAt, t("listTime.yesterday"), weekdays)
          : ""}
        </small>
      </span>
      {conversation.unreadCount ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-caption-strong text-ink-inverse">
          {conversation.unreadCount}
        </span>
      ) : conversation.isMuted ? (
        <Icon name="notifications-off" size={16} className="text-icon-tertiary" />
      ) : null}
    </span>
    </>
  );
}

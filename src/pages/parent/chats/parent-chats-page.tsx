import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { useConversationSync } from "@/modules/conversation";
import { useChat } from "@/modules/message";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { ChannelView } from "@/widgets/channel-view";
import { DirectChatView } from "@/widgets/direct-chat";
import { ParentChatList } from "./parent-chat-list";

function ParentConversation({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const chat = useChat(conversationId, { role: "parent", senderId: currentUserId });
  const { conversation, messages, markRead } = chat;
  const lastIncomingId =
    messages.data?.filter((item) => !item.pending && item.senderId !== currentUserId).at(-1)?.id ?? "";
  const readKey = messages.data ? `${conversationId}:${lastIncomingId}` : null;
  const readRef = useRef<string | null>(null);

  useEffect(() => {
    if (!readKey || readRef.current === readKey) return;
    readRef.current = readKey;
    markRead.mutate();
  }, [readKey, markRead]);

  if (!conversation.isLoading && !conversation.data) return <Navigate to={ROUTES.parent.chats} replace />;
  if (!conversation.data)
    return (
      <div className="chat-page">
        <div className="chat-header-skeleton" />
        <div className="message-loading">
          <div className="message-skeleton" />
          <div className="message-skeleton right" />
        </div>
      </div>
    );

  if (conversation.data.type === "channel")
    return (
      <ChannelView
        chat={chat}
        conversation={conversation.data}
        role="parent"
        backTo={ROUTES.parent.chats}
        currentUserId={currentUserId}
      />
    );

  return (
    <DirectChatView
      chat={chat}
      conversation={conversation.data}
      role="parent"
      backTo={ROUTES.parent.chats}
      currentUserId={currentUserId}
    />
  );
}

export function ParentChatsPage() {
  const { t } = useTranslation("parent");
  const { conversationId } = useParams();
  const isCompact = useIsCompact();
  useConversationSync("parent");

  if (isCompact)
    return conversationId ? (
      <div className="fixed inset-0 z-20 flex flex-col bg-canvas">
        <ParentConversation key={conversationId} conversationId={conversationId} />
      </div>
    ) : (
      <ParentChatList compact />
    );

  return (
    <div className="flex h-full min-h-0">
      <ParentChatList activeId={conversationId} compact={false} />
      <div className="flex min-w-0 flex-1 flex-col">
        {conversationId ? (
          <ParentConversation key={conversationId} conversationId={conversationId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon name="forum" size={32} />
            </span>
            <strong className="font-heading text-h3 text-ink">{t("chats.pickTitle")}</strong>
            <p className="max-w-82 text-body-sm text-ink-secondary">{t("chats.pickHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

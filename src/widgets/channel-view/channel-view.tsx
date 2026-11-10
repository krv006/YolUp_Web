import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageComposer, MessageList, type ChatController } from "@/modules/message";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ChatMessage, Conversation, ConversationRole, SendMessagePayload } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { ChannelInfoDialog } from "./channel-info-dialog";
import { ChannelThread } from "./channel-thread";

export interface ChannelViewProps {
  chat: ChatController;
  conversation: Conversation;
  role: ConversationRole;
  backTo: string;
  currentUserId: string | null;
}

export function ChannelView({ chat, conversation, role, backTo, currentUserId }: ChannelViewProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const { messages, sendMessage, retryMessage, updateMessage, deleteMessage, toggleReaction, sendTyping } = chat;
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const owner = Boolean(conversation.canWrite);
  const canComment = conversation.canComment ?? true;
  const threadPost = (messages.data ?? []).find((item) => item.id === threadPostId) ?? null;

  async function handleSend(payload: SendMessagePayload) {
    try {
      if (editing) {
        await updateMessage.mutateAsync({ messageId: editing.id, text: payload.text });
        setEditing(null);
        return;
      }
      await sendMessage.mutateAsync(payload);
    } catch {
      toast.error(t("directPage.actionFailed"));
    }
  }

  const thread = threadPost ? (
    <ChannelThread
      key={threadPost.id}
      roomId={conversation.id}
      role={role}
      post={threadPost}
      canComment={canComment}
      currentUserId={currentUserId}
      onClose={() => setThreadPostId(null)}
    />
  ) : null;

  return (
    <div className="flex h-full min-h-0">
      <section className="chat-page min-w-0 flex-1 max-lg:bg-auth-gradient lg:bg-page-gradient">
        <header className="flex h-[73px] shrink-0 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-subtle"
            aria-label={t("header.backAria")}
            onClick={() => navigate(backTo)}
          >
            <Icon name="chevron-left" size={22} />
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label={t("header.openInfoAria", { title: conversation.title })}
            onClick={() => setInfoOpen(true)}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">
              <Icon name="campaign" size={22} />
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-title text-ink">{conversation.title}</strong>
              <small className="truncate text-body-xs text-ink-secondary">
                {t("channel.subtitle", { count: conversation.memberCount })}
              </small>
            </span>
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink-secondary transition-colors hover:bg-subtle"
            aria-label={t("channel.infoTitle")}
            onClick={() => setInfoOpen(true)}
          >
            <Icon name="info" size={20} />
          </button>
        </header>

        <MessageList
          messages={messages.data}
          conversation={conversation}
          loading={messages.isLoading}
          error={messages.isError}
          onRetry={messages.refetch}
          onRetryMessage={retryMessage}
          currentUserId={currentUserId}
          onReply={(message) => setThreadPostId(message.id)}
          onEdit={(message) => setEditing(message)}
          onDelete={(message, scope) => deleteMessage.mutate({ messageId: message.id, scope })}
          onReact={(message, emoji) => toggleReaction.mutate({ messageId: message.id, emoji })}
          onOpenThread={(message) => setThreadPostId(message.id)}
        />

        {owner ? (
          <MessageComposer
            key={editing?.id ?? "channel-compose"}
            onSend={handleSend}
            onTyping={sendTyping}
            sending={sendMessage.isPending || updateMessage.isPending}
            editingMessage={editing}
            currentUserId={currentUserId}
            onCancelContext={() => setEditing(null)}
            roomId={conversation.id}
          />
        ) : (
          <p className="shrink-0 border-t border-line bg-surface px-6 py-4 text-center text-body-sm text-ink-secondary">
            {t("channel.readOnly")}
          </p>
        )}
      </section>

      {thread && !isCompact ? <aside className="hidden h-full w-96 shrink-0 border-l border-line lg:block">{thread}</aside> : null}
      {thread && isCompact ? <div className="fixed inset-0 z-40">{thread}</div> : null}

      <ChannelInfoDialog
        conversation={conversation}
        open={infoOpen}
        onOpenChange={setInfoOpen}
        manage={owner}
        currentUserId={currentUserId}
        afterDelete={backTo}
      />
    </div>
  );
}

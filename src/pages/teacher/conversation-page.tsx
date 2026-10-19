import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { ForwardDialog } from "@/widgets/forward-dialog";
import { ChatHeader } from "@/modules/conversation";
import { MessageComposer, MessageList, useChat } from "@/modules/message";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { GroupWorkspace } from "@/widgets/group-workspace";

export function ConversationPage() {
  const { t } = useTranslation("chat");
  const { conversationId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const chat = useChat(conversationId, {
    role: "teacher",
    senderId: currentUserId,
  });
  const {
    conversation,
    messages,
    sendMessage,
    retryMessage,
    updateMessage,
    deleteMessage,
    toggleReaction,
    deleteMessages,
    forwardMessages,
    pinnedMessages,
    pinMessage,
    markRead,
    sendTyping,
  } = chat;
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage[]>([]);
  const lastMessageId = messages.data?.[messages.data.length - 1]?.id ?? null;
  const readRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastMessageId || readRef.current === lastMessageId) return;
    readRef.current = lastMessageId;
    markRead.mutate(lastMessageId);
  }, [lastMessageId, markRead]);

  const activeConversation = conversation.data;

  if (!conversation.isLoading && !activeConversation)
    return <Navigate to="/teacher/chats" replace />;

  if (conversation.isLoading || !activeConversation)
    return (
      <div className="chat-page">
        <div className="chat-header-skeleton" />
        <div className="message-loading">
          <div className="message-skeleton" />
          <div className="message-skeleton right" />
          <div className="message-skeleton" />
        </div>
      </div>
    );

  if (activeConversation.type === "group") {
    return (
      <GroupWorkspace
        conversation={activeConversation}
        chat={chat}
        messages={messages}
        sendMessage={sendMessage}
        sendTyping={sendTyping}
        retryMessage={retryMessage}
      />
    );
  }

  async function handleSend(payload: SendMessagePayload) {
    try {
      if (editingMessage) {
        await updateMessage.mutateAsync({
          messageId: editingMessage.id,
          text: payload.text,
        });
        setEditingMessage(null);
        toast.success(t("directPage.messageEdited"));
        return;
      }
      await sendMessage.mutateAsync({
        ...payload,
        replyTo: replyMessage
          ? {
              author:
                replyMessage.senderName ||
                (replyMessage.senderId === currentUserId ? t("composer.youLabel") : activeConversation!.title),
              text: replyMessage.text,
            }
          : undefined,
      });
      setReplyMessage(null);
    } catch {
      toast.error(t("directPage.actionFailedRetry"));
    }
  }

  async function handleDelete(message: ChatMessage, scope: "me" | "everyone") {
    try {
      await deleteMessage.mutateAsync({ messageId: message.id, scope });
      if (replyMessage?.id === message.id) setReplyMessage(null);
      if (editingMessage?.id === message.id) setEditingMessage(null);
      toast.success(
        scope === "everyone" ? t("directPage.deletedForEveryone") : t("directPage.deletedForMe")
      );
    } catch {
      toast.error(t("directPage.deleteFailed"));
    }
  }

  return (
    <section className="chat-page">
      <ChatHeader conversation={activeConversation} />
      <MessageList
        messages={messages.data}
        conversation={activeConversation}
        loading={messages.isLoading}
        error={messages.isError}
        onRetry={messages.refetch}
        currentUserId={currentUserId}
        onReply={(message) => {
          setEditingMessage(null);
          setReplyMessage(message);
        }}
        onEdit={(message) => {
          setReplyMessage(null);
          setEditingMessage(message);
        }}
        onDelete={handleDelete}
        onReact={(message, emoji) => toggleReaction.mutate({ messageId: message.id, emoji })}
        pinnedIds={(pinnedMessages.data ?? []).map((item) => item.messageId)}
        onPin={(message, pinned) => pinMessage.mutate({ messageId: message.id, pinned })}
        onForward={(items) => setForwardTarget(items)}
        onBulkDelete={(messageIds, scope) => deleteMessages.mutate({ messageIds, scope })}
        onRetryMessage={retryMessage}
      />
      <MessageComposer
        key={editingMessage?.id ?? "compose"}
        onSend={handleSend}
        sending={sendMessage.isPending || updateMessage.isPending}
        replyTo={replyMessage}
        editingMessage={editingMessage}
        currentUserId={currentUserId}
        onCancelContext={() => {
          setReplyMessage(null);
          setEditingMessage(null);
        }}
        onTyping={sendTyping}
        roomId={conversationId ?? null}
      />

      <ForwardDialog
        open={forwardTarget.length > 0}
        onOpenChange={(open) => !open && setForwardTarget([])}
        messages={forwardTarget}
        role="teacher"
        pending={forwardMessages.isPending}
        onConfirm={(roomIds) =>
          forwardMessages.mutate(
            { messageIds: forwardTarget.map((item) => item.id), roomIds },
            {
              onSuccess: () => {
                setForwardTarget([]);
                toast.success(t("forward.done"));
              },
            }
          )
        }
      />
    </section>
  );
}

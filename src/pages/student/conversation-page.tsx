import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { ChatHeader } from "@/modules/conversation";
import { MessageComposer, MessageList, useChat, useChatUiStore } from "@/modules/message";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { ForwardDialog } from "@/widgets/forward-dialog";
import { StudentGroupWorkspace } from "@/widgets/student-group-workspace";

export function StudentConversationPage() {
  const { t } = useTranslation("chat");
  const { conversationId } = useParams();
  const { user } = useAuth();
  const selectionMode = useChatUiStore((state) => state.selected.length > 0);
  const currentUserId = user?.id ?? null;
  const chat = useChat(conversationId, {
    role: "student",
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
    return <Navigate to="/student/chats" replace />;

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

  if (activeConversation.type === "group")
    return (
      <StudentGroupWorkspace
        conversation={activeConversation}
        chat={chat}
        messages={messages}
        sendMessage={sendMessage}
        retryMessage={retryMessage}
        sendTyping={sendTyping}
        currentUserId={currentUserId ?? undefined}
      />
    );

  async function handleSend(payload: SendMessagePayload) {
    try {
      if (editingMessage) {
        await updateMessage.mutateAsync({ messageId: editingMessage.id, text: payload.text });
        setEditingMessage(null);
        toast.success(t("directPage.messageEdited"));
        return;
      }
      await sendMessage.mutateAsync({
        ...payload,
        replyTo: replyMessage
          ? {
              author: replyMessage.senderId === currentUserId ? t("composer.youLabel") : activeConversation!.title,
              text: replyMessage.text,
            }
          : undefined,
      });
      setReplyMessage(null);
    } catch {
      toast.error(t("directPage.actionFailed"));
    }
  }

  async function handleDelete(message: ChatMessage, scope: "me" | "everyone") {
    try {
      await deleteMessage.mutateAsync({ messageId: message.id, scope });
      toast.success(t("directPage.messageDeleted"));
    } catch {
      toast.error(t("directPage.deleteFailed"));
    }
  }

  return (
    <section className="chat-page">
      <ChatHeader conversation={activeConversation} backTo="/student/chats" />
      <MessageList
        messages={messages.data}
        conversation={activeConversation}
        loading={messages.isLoading}
        error={messages.isError}
        onRetry={messages.refetch}
        onRetryMessage={retryMessage}
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
      />
      {selectionMode ? null : (
      <MessageComposer
        key={editingMessage?.id ?? "student-direct-compose"}
        onSend={handleSend}
        onTyping={sendTyping}
        sending={sendMessage.isPending || updateMessage.isPending}
        replyTo={replyMessage}
        editingMessage={editingMessage}
        currentUserId={currentUserId}
        onCancelContext={() => {
          setReplyMessage(null);
          setEditingMessage(null);
        }}
        roomId={conversationId ?? null}
      />
      )}

      <ForwardDialog
        open={forwardTarget.length > 0}
        onOpenChange={(open) => !open && setForwardTarget([])}
        messages={forwardTarget}
        role="student"
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

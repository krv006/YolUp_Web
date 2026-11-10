import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ChatHeader, DirectRequestBar, isDirectLocked } from "@/modules/conversation";
import { MessageComposer, MessageList, useChatUiStore, type ChatController } from "@/modules/message";
import type { ChatMessage, Conversation, SendMessagePayload } from "@/shared/types";
import { ForwardDialog } from "@/widgets/forward-dialog";

export interface DirectChatViewProps {
  chat: ChatController;
  conversation: Conversation;
  role: "student" | "parent";
  backTo: string;
  currentUserId: string | null;
}

export function DirectChatView({ chat, conversation, role, backTo, currentUserId }: DirectChatViewProps) {
  const { t } = useTranslation("chat");
  const selectionMode = useChatUiStore((state) => state.selected.length > 0);
  const {
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
    sendTyping,
  } = chat;
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage[]>([]);

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
        replyToId: replyMessage?.id ?? null,
        replyTo: replyMessage
          ? {
              author: replyMessage.senderId === currentUserId ? t("composer.youLabel") : conversation.title,
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
    <section className="chat-page max-lg:bg-auth-gradient lg:bg-page-gradient">
      <ChatHeader conversation={conversation} backTo={backTo} />
      <MessageList
        messages={messages.data}
        conversation={conversation}
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
      {selectionMode ? null : isDirectLocked(conversation) ? (
        <DirectRequestBar conversation={conversation} role={role} />
      ) : (
        <MessageComposer
          key={editingMessage?.id ?? `${role}-direct-compose`}
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
          roomId={conversation.id}
        />
      )}

      <ForwardDialog
        open={forwardTarget.length > 0}
        onOpenChange={(open) => !open && setForwardTarget([])}
        messages={forwardTarget}
        role={role}
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

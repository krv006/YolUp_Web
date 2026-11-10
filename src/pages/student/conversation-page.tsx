import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useChat } from "@/modules/message";
import { ChannelView } from "@/widgets/channel-view";
import { DirectChatView } from "@/widgets/direct-chat";
import { StudentGroupWorkspace } from "@/widgets/student-group-workspace";

export function StudentConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const chat = useChat(conversationId, {
    role: "student",
    senderId: currentUserId,
  });
  const { conversation, messages, sendMessage, retryMessage, markRead, sendTyping } = chat;
  const lastIncomingId =
    messages.data?.filter((item) => !item.pending && item.senderId !== currentUserId).at(-1)?.id ?? "";
  const readKey = messages.data ? `${conversationId}:${lastIncomingId}` : null;
  const readRef = useRef<string | null>(null);

  useEffect(() => {
    if (!readKey || readRef.current === readKey) return;
    readRef.current = readKey;
    markRead.mutate();
  }, [readKey, markRead]);

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

  if (activeConversation.type === "channel")
    return (
      <ChannelView
        chat={chat}
        conversation={activeConversation}
        role="student"
        backTo="/student/chats"
        currentUserId={currentUserId}
      />
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

  return (
    <DirectChatView
      chat={chat}
      conversation={activeConversation}
      role="student"
      backTo="/student/chats"
      currentUserId={currentUserId}
    />
  );
}

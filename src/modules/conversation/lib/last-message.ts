import type { Conversation } from "@/shared/types";

export interface LastMessageLabels {
  voice: string;
  image: string;
  video: string;
}

const FILE_NAME = /\.\w{2,5}$/;

export function isOwnLastMessage(
  conversation: Conversation,
  user: { id: string; firstName?: string; username?: string } | null | undefined
): boolean {
  if (!user) return false;
  if (conversation.lastSenderId) return conversation.lastSenderId === user.id;
  const sender = conversation.lastSender;
  if (!sender) return false;
  return sender === "me" || sender === user.firstName || sender === user.username;
}

export function lastMessageBody(conversation: Conversation, labels: LastMessageLabels): string {
  const text = conversation.lastMessage;
  switch (conversation.lastMessageType) {
    case "voice":
      return `🎤 ${labels.voice}`;
    case "image":
      return text && !FILE_NAME.test(text) ? `🖼 ${text}` : `🖼 ${labels.image}`;
    case "video":
      return text && !FILE_NAME.test(text) ? `🎬 ${text}` : `🎬 ${labels.video}`;
    case "file":
      return `📎 ${text}`;
    default:
      return text;
  }
}

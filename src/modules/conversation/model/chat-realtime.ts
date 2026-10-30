import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import type { ConversationRole } from "@/shared/types";
import { conversationKeys } from "./conversation.keys";
import { clearRoomTyping, markRoomTyping } from "./typing.store";

export const CHAT_TYPING_TTL_MS = 5000;

export const useActiveConversationStore = create<{ id: string | null }>(() => ({ id: null }));

export function setActiveConversation(id: string | null) {
  useActiveConversationStore.setState({ id });
}

export interface ChatActivity {
  roomId: string;
  senderId: string | null;
}

export function applyChatActivity(
  queryClient: QueryClient,
  role: ConversationRole,
  { roomId, senderId }: ChatActivity,
  currentUserId: string | null
) {
  clearRoomTyping(roomId);
  const open = useActiveConversationStore.getState().id === roomId;
  if (open && senderId !== currentUserId) return;
  void queryClient.invalidateQueries({ queryKey: conversationKeys.list(role), exact: true });
}

export function applyChatTyping(
  roomId: string,
  typing: { userId: string; name: string; kind: "text" | "voice" },
  currentUserId: string | null
) {
  if (typing.userId && typing.userId === currentUserId) return;
  markRoomTyping(roomId, { name: typing.name, kind: typing.kind }, CHAT_TYPING_TTL_MS);
}

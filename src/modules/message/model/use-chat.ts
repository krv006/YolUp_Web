import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Page } from "@/shared/api";
import { i18n } from "@/shared/i18n";
import { conversationApi, conversationKeys, readCachedConversation } from "@/modules/conversation";
import type { ChatMessage, Conversation, ConversationRole, SendMessagePayload } from "@/shared/types";
import { messageApi } from "../api/message.api";
import { ChatSocketManager, type SocketState } from "../lib/chat-socket-manager";
import { applyReactions, markMessageFailed, upsertMessage } from "../lib/message.mappers";
import { messageKeys } from "./message.keys";

const TYPING_RESET_MS = 2600;

const REST_FALLBACK_POLL_MS = 6000;

export interface UseChatOptions {
  role?: ConversationRole;
  senderId?: string | null;
}

interface OptimisticContext {
  temporaryId: string;
}

export function useChat(
  conversationId: string | undefined,
  { role = "teacher", senderId = null }: UseChatOptions = {}
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messagesKey = useMemo(
    () => messageKeys.all(conversationId ?? "", role),
    [conversationId, role]
  );
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [typing, setTyping] = useState<{ name: string; kind: "text" | "voice" } | null>(null);

  const cachedConversation = readCachedConversation(queryClient, conversationId, role);

  const conversation = useQuery({
    queryKey: conversationKeys.detail(conversationId ?? "", role),
    queryFn: ({ signal }) => conversationApi.getById(conversationId as string, { signal }),
    enabled: Boolean(conversationId),
    placeholderData: cachedConversation,
  });

  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: async ({ signal }) => {
      const items = await messageApi.getAll(conversationId as string, { signal }, senderId);
      const local = (queryClient.getQueryData<ChatMessage[]>(messagesKey) ?? []).filter(
        (item) => item.pending || item.failed
      );
      return local.reduce((list, item) => upsertMessage(list, item), items);
    },
    enabled: Boolean(conversationId),
    refetchInterval: socketState === "connected" ? false : REST_FALLBACK_POLL_MS,
  });

  const socket = useMemo(
    () =>
      conversationId
        ? new ChatSocketManager({
            roomId: conversationId,
            currentUserId: senderId,
            onState: setSocketState,
            onEvent: (event) => {
              if (event.type === "message") {
                queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
                  upsertMessage(current, event.message)
                );
              }
              if (event.type === "edited") {
                queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
                  current.map((item) =>
                    item.id === event.messageId
                      ? { ...item, text: event.text, editedAt: event.editedAt }
                      : item
                  )
                );
              }
              if (event.type === "deleted") {
                queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
                  current.filter((item) => !event.messageIds.includes(item.id))
                );
              }
              if (event.type === "reaction") {
                queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
                  applyReactions(current, event.messageId, event.reactions, senderId)
                );
              }
              if (event.type === "pinned") {
                queryClient.invalidateQueries({ queryKey: messageKeys.pinned(conversationId ?? "") });
              }
              if (event.type === "roomUpdated" || event.type === "read") {
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.detail(conversationId ?? "", role),
                });
              }
              if (event.type === "typing" && event.userId !== String(senderId)) {
                const markRow = (value: { name: string; kind: "text" | "voice" } | null) =>
                  queryClient.setQueryData<Page<Conversation>>(conversationKeys.list(role), (current) =>
                    current
                      ? {
                          ...current,
                          items: current.items.map((item) =>
                            item.id === conversationId
                              ? { ...item, typing: Boolean(value), typingName: value?.name ?? null, typingKind: value?.kind }
                              : item
                          ),
                        }
                      : current
                  );
                const value = { name: event.name, kind: event.kind };
                setTyping(value);
                markRow(value);
                globalThis.setTimeout(() => {
                  setTyping(null);
                  markRow(null);
                }, TYPING_RESET_MS);
              }
              if (event.type === "removed") {
                toast.error(i18n.t("chat:removedFromGroup"));
                queryClient.invalidateQueries({ queryKey: conversationKeys.all });
                navigate(role === "teacher" ? "/teacher/chats" : "/student/chats", {
                  replace: true,
                });
              }
            },
          })
        : null,
    [conversationId, messagesKey, navigate, queryClient, role, senderId]
  );

  useEffect(() => {
    socket?.start();
    return () => socket?.stop();
  }, [socket]);

  const sendMessage = useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      messageApi.send(conversationId as string, payload, senderId),
    onMutate: async (payload): Promise<OptimisticContext> => {
      const temporaryId = `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: temporaryId,
        conversationId: conversationId ?? "",
        senderId: senderId ?? "",
        senderName: "",
        senderUsername: "",
        text: payload.text,
        type: "text",
        createdAt: new Date().toISOString(),
        status: "pending",
        pending: true,
        failed: false,
        retryPayload: payload,
      };
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        upsertMessage(current, optimistic)
      );
      return { temporaryId };
    },
    onSuccess: (message, _payload, context) => {
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        upsertMessage(
          current.filter((item) => item.id !== context.temporaryId),
          message
        )
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
    onError: (_error, _payload, context) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        markMessageFailed(current, context?.temporaryId ?? "")
      ),
  });

  const updateMessage = useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      messageApi.update(messageId, text, senderId),
    onSuccess: (message) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        upsertMessage(current, message)
      ),
  });

  const deleteMessage = useMutation({
    mutationFn: ({ messageId, scope }: { messageId: string; scope: "me" | "everyone" }) =>
      messageApi.remove(messageId, scope),
    onSuccess: (_result, { messageId }) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        current.filter((item) => item.id !== messageId)
      ),
  });

  const deleteMessages = useMutation({
    mutationFn: ({ messageIds, scope }: { messageIds: string[]; scope: "me" | "everyone" }) =>
      messageApi.bulkRemove(messageIds, scope),
    onSuccess: (_result, { messageIds }) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        current.filter((item) => !messageIds.includes(item.id))
      ),
  });

  const forwardMessages = useMutation({
    mutationFn: ({ messageIds, roomIds }: { messageIds: string[]; roomIds: string[] }) =>
      messageApi.forward(messageIds, roomIds, senderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  });

  const toggleReaction = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messageApi.addReaction(messageId, emoji),
    onSuccess: (reactions, { messageId }) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        applyReactions(current, messageId, reactions, senderId)
      ),
  });

  const pinnedMessages = useQuery({
    queryKey: messageKeys.pinned(conversationId ?? ""),
    queryFn: ({ signal }) => messageApi.getPinned(conversationId as string, { signal }),
    enabled: Boolean(conversationId),
  });

  const pinMessage = useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      pinned
        ? messageApi.unpin(conversationId as string, messageId)
        : messageApi.pin(conversationId as string, messageId),
    onSuccess: (items) =>
      queryClient.setQueryData(messageKeys.pinned(conversationId ?? ""), items),
  });

  const markRead = useMutation({
    mutationFn: (lastReadMessageId?: string | null) =>
      messageApi.markRead(conversationId as string, lastReadMessageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  });

  function retryMessage(message: ChatMessage) {
    queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
      current.filter((item) => item.id !== message.id)
    );
    sendMessage.mutate(message.retryPayload ?? { text: message.text });
  }

  return {
    conversation: {
      ...conversation,
      data: conversation.data
        ? { ...conversation.data, typing: Boolean(typing), typingName: typing?.name ?? null, typingKind: typing?.kind }
        : conversation.data,
    },
    messages,
    sendMessage,
    retryMessage,
    updateMessage,
    deleteMessage,
    deleteMessages,
    forwardMessages,
    toggleReaction,
    pinnedMessages,
    pinMessage,
    markRead,
    socketState,
    sendTyping: (kind?: "text" | "voice") => socket?.sendTyping(kind),
  };
}

export type ChatController = ReturnType<typeof useChat>;

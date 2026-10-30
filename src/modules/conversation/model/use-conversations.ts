import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Page } from "@/shared/api";
import type { Conversation, ConversationRole } from "@/shared/types";
import { conversationApi } from "../api/conversation.api";
import type { DirectAction } from "../api/conversation.dto";
import { conversationKeys } from "./conversation.keys";

const LIST_SYNC_MS = 10_000;

export function useConversationSync(role: ConversationRole | null, live = false) {
  useQuery({
    queryKey: conversationKeys.list(role ?? "teacher"),
    queryFn: ({ signal }) => conversationApi.getAll({ signal }),
    enabled: role !== null,
    refetchInterval: live ? false : LIST_SYNC_MS,
  });
}

export function useConversations(role: ConversationRole = "teacher") {
  return useQuery({
    queryKey: conversationKeys.list(role),
    queryFn: ({ signal }) => conversationApi.getAll({ signal }),
    select: (page) => page.items,
  });
}

export function readCachedConversation(
  client: QueryClient,
  id: string | undefined,
  role: ConversationRole = "teacher"
): Conversation | undefined {
  if (!id) return undefined;
  const page = client.getQueryData<Page<Conversation>>(conversationKeys.list(role));
  return page?.items.find((item) => item.id === id);
}

export function usePinConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, pinned }: { roomId: string; pinned: boolean }) =>
      conversationApi.setPinned(roomId, pinned),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useMuteConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, muted }: { roomId: string; muted: boolean }) =>
      conversationApi.setMuted(roomId, muted),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useAnnouncementMode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, enabled }: { roomId: string; enabled: boolean }) =>
      conversationApi.setAnnouncementOnly(roomId, enabled),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useLeaveConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => conversationApi.leave(roomId),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useTeachersForDirect(enabled = true) {
  return useQuery({
    queryKey: ["conversations", "teachers"],
    queryFn: ({ signal }) => conversationApi.getTeachers({ signal }),
    enabled,
  });
}

export function useRequestDirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (teacherId: string) => conversationApi.requestDirect(teacherId),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useSetRoomImage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, image }: { roomId: string; image: File }) =>
      conversationApi.setRoomImage(roomId, image),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useRespondDirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, action }: { roomId: string; action: DirectAction }) =>
      conversationApi.respondDirect(roomId, action),
    onSuccess: () => client.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}

export function useGroupImages(role: ConversationRole = "teacher") {
  const conversations = useConversations(role);
  return useMemo(
    () =>
      new Map(
        (conversations.data ?? [])
          .filter((item) => item.courseId && item.imageUrl)
          .map((item) => [item.courseId as string, item.imageUrl as string])
      ),
    [conversations.data]
  );
}

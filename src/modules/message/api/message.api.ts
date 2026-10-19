import { apiClient, type RequestOptions } from "@/shared/api";
import type { ChatMember, ChatMessage, PinnedChatMessage, SendMessagePayload } from "@/shared/types";
import { messageEndpoints } from "./message.endpoints";
import type {
  ChatMemberDto,
  MessageDto,
  MessagePageDto,
  MessageReactionDto,
  MessageSearchDto,
  PinnedMessageDto,
} from "./message.dto";
import { mapChatMemberDto, mapMessageDto, mapPinnedDto } from "../lib/message.mappers";

function toList(response: MessageDto[] | MessagePageDto): MessageDto[] {
  return Array.isArray(response) ? response : (response.items ?? []);
}

function buildSendBody(payload: SendMessagePayload): FormData | Record<string, unknown> {
  const file = payload.file ?? null;
  if (file) {
    const body = new FormData();
    body.set("text", payload.text ?? "");
    body.set("file", file);
    if (payload.replyToId) body.set("reply_to_id", payload.replyToId);
    if (payload.clientMessageId) body.set("client_message_id", payload.clientMessageId);
    (payload.mentions ?? []).forEach((id) => body.append("mentions", id));
    return body;
  }
  return {
    text: payload.text ?? "",
    ...(payload.replyToId ? { reply_to_id: payload.replyToId } : {}),
    ...(payload.clientMessageId ? { client_message_id: payload.clientMessageId } : {}),
    ...(payload.mentions?.length ? { mentions: payload.mentions } : {}),
  };
}

export const messageApi = {
  async getAll(
    roomId: string,
    options: RequestOptions = {},
    currentUserId?: string | null
  ): Promise<ChatMessage[]> {
    const response = await apiClient.get<MessageDto[] | MessagePageDto>(
      messageEndpoints.history(roomId),
      options
    );
    return toList(response).map((item) => mapMessageDto(item, currentUserId));
  },

  async getBefore(
    roomId: string,
    before: string,
    limit = 30,
    options: RequestOptions = {},
    currentUserId?: string | null
  ): Promise<{ items: ChatMessage[]; hasMore: boolean }> {
    const response = await apiClient.get<MessagePageDto>(messageEndpoints.history(roomId), {
      ...options,
      query: { before, limit },
    });
    return {
      items: toList(response).map((item) => mapMessageDto(item, currentUserId)),
      hasMore: Array.isArray(response) ? false : Boolean(response.has_more),
    };
  },

  async getAfter(
    roomId: string,
    after: string,
    options: RequestOptions = {},
    currentUserId?: string | null
  ): Promise<ChatMessage[]> {
    const response = await apiClient.get<MessageDto[] | MessagePageDto>(
      messageEndpoints.history(roomId),
      { ...options, query: { after } }
    );
    return toList(response).map((item) => mapMessageDto(item, currentUserId));
  },

  async send(
    roomId: string,
    payload: SendMessagePayload,
    currentUserId?: string | null
  ): Promise<ChatMessage> {
    if (payload.voice) {
      const body = new FormData();
      body.set("file", payload.voice.file);
      body.set("duration_ms", String(payload.voice.durationMs));
      if (payload.voice.waveform?.length)
        body.set("waveform", JSON.stringify(payload.voice.waveform.slice(0, 200)));
      if (payload.replyToId) body.set("reply_to_id", payload.replyToId);
      if (payload.clientMessageId) body.set("client_message_id", payload.clientMessageId);
      return mapMessageDto(
        await apiClient.post<MessageDto>(messageEndpoints.voice(roomId), body),
        currentUserId
      );
    }
    return mapMessageDto(
      await apiClient.post<MessageDto>(messageEndpoints.send(roomId), buildSendBody(payload)),
      currentUserId
    );
  },

  async update(messageId: string, text: string, currentUserId?: string | null): Promise<ChatMessage> {
    return mapMessageDto(
      await apiClient.patch<MessageDto>(messageEndpoints.message(messageId), { text }),
      currentUserId
    );
  },

  async remove(messageId: string, scope: "me" | "everyone" = "me"): Promise<void> {
    await apiClient.delete(messageEndpoints.message(messageId), { query: { scope } });
  },

  async bulkRemove(messageIds: string[], scope: "me" | "everyone" = "me"): Promise<number> {
    const response = await apiClient.post<{ deleted?: number }>(messageEndpoints.bulkDelete, {
      message_ids: messageIds,
      scope,
    });
    return response?.deleted ?? messageIds.length;
  },

  async forward(
    messageIds: string[],
    targetRoomIds: string[],
    currentUserId?: string | null
  ): Promise<ChatMessage[]> {
    const response = await apiClient.post<MessageDto[] | MessagePageDto>(
      messageEndpoints.forward,
      { message_ids: messageIds, target_room_ids: targetRoomIds }
    );
    return toList(response).map((item) => mapMessageDto(item, currentUserId));
  },

  async addReaction(messageId: string, emoji: string): Promise<MessageReactionDto[]> {
    const response = await apiClient.post<{ reactions?: MessageReactionDto[] }>(
      messageEndpoints.reactions(messageId),
      { emoji, toggle: true }
    );
    return response?.reactions ?? [];
  },

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await apiClient.delete(messageEndpoints.reactions(messageId), { query: { emoji } });
  },

  async getPinned(roomId: string, options?: RequestOptions): Promise<PinnedChatMessage[]> {
    const items = await apiClient.get<PinnedMessageDto[]>(messageEndpoints.pinned(roomId), options);
    return (items ?? []).map(mapPinnedDto);
  },

  async pin(roomId: string, messageId: string): Promise<PinnedChatMessage[]> {
    const items = await apiClient.post<PinnedMessageDto[]>(messageEndpoints.pinned(roomId), {
      message_id: messageId,
    });
    return (items ?? []).map(mapPinnedDto);
  },

  async unpin(roomId: string, messageId: string): Promise<PinnedChatMessage[]> {
    const items = await apiClient.delete<PinnedMessageDto[]>(
      messageEndpoints.pinnedItem(roomId, messageId)
    );
    return (items ?? []).map(mapPinnedDto);
  },

  async markRead(roomId: string, lastReadMessageId?: string | null): Promise<void> {
    await apiClient.post(messageEndpoints.read(roomId), {
      last_read_message_id: lastReadMessageId ?? null,
    });
  },

  async search(
    roomId: string,
    query: string,
    options?: RequestOptions
  ): Promise<{ total: number; items: Array<{ id: string; text: string; createdAt: string }> }> {
    const response = await apiClient.get<MessageSearchDto>(messageEndpoints.search(roomId), {
      ...options,
      query: { q: query },
    });
    return {
      total: response?.total ?? 0,
      items: (response?.items ?? []).map((item) => ({
        id: String(item.id),
        text: item.text ?? "",
        createdAt: item.created_at ?? "",
      })),
    };
  },

  async getMembers(roomId: string, query = "", options?: RequestOptions): Promise<ChatMember[]> {
    const items = await apiClient.get<ChatMemberDto[]>(messageEndpoints.members(roomId), {
      ...options,
      query: query ? { query } : undefined,
    });
    return (items ?? []).map(mapChatMemberDto);
  },

  downloadFile(messageId: string, options?: RequestOptions) {
    return apiClient.get<Blob>(messageEndpoints.file(messageId), {
      ...options,
      responseType: "blob",
    });
  },
};

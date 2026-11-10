import { apiClient } from "@/shared/api";
import type { Conversation } from "@/shared/types";
import type { ChatRoomDto } from "./conversation.dto";
import { mapConversationDto } from "../lib/conversation.mappers";

export interface AudienceInput {
  courseIds: string[];
  studentIds: string[];
}

export interface ChannelInput extends AudienceInput {
  title: string;
  description: string;
}

const ENDPOINTS = Object.freeze({
  channels: "/api/v1/chat/channels/",
  channel: (id: string) => `/api/v1/chat/channels/${id}/`,
  members: (id: string) => `/api/v1/chat/channels/${id}/members/`,
  member: (id: string, userId: string) => `/api/v1/chat/channels/${id}/members/${userId}/`,
});

export function audienceBody({ courseIds, studentIds }: AudienceInput) {
  return {
    ...(courseIds.length ? { course_ids: courseIds } : {}),
    ...(studentIds.length ? { student_ids: studentIds } : {}),
  };
}

export const channelApi = {
  async create(input: ChannelInput): Promise<Conversation> {
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(ENDPOINTS.channels, {
        title: input.title.trim(),
        description: input.description.trim(),
        ...audienceBody(input),
      })
    );
  },
  async update(id: string, patch: { title?: string; description?: string }): Promise<Conversation> {
    return mapConversationDto(await apiClient.patch<ChatRoomDto>(ENDPOINTS.channel(id), patch));
  },
  async remove(id: string) {
    await apiClient.delete(ENDPOINTS.channel(id));
  },
  async addMembers(id: string, audience: AudienceInput) {
    const dto = await apiClient.post<{ added?: number }>(ENDPOINTS.members(id), audienceBody(audience));
    return Number(dto?.added ?? 0);
  },
  async removeMember(id: string, userId: string) {
    await apiClient.delete(ENDPOINTS.member(id, userId));
  },
};

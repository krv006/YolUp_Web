import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { voiceEndpoints } from "./voice.endpoints";
import type {
  VoiceHand,
  VoiceHandDto,
  VoiceJoinRequestDto,
  VoiceRoomDto,
  VoiceRoomFormValues,
  VoiceTokenDto,
} from "./voice.dto";
import {
  mapVoiceJoinRequestDto,
  mapVoiceRoomDto,
  mapVoiceRoomRequest,
  mapVoiceTokenDto,
} from "../lib/voice.mappers";

export const voiceApi = {
  async getAll(courseId: string, options: RequestOptions = {}) {
    const dto = await apiClient.get<unknown>(voiceEndpoints.list, {
      ...options,
      query: { course: courseId, page_size: 50 },
    });
    return normalizePagination<VoiceRoomDto>(dto).items.map(mapVoiceRoomDto);
  },
  async getOne(id: string, options?: RequestOptions) {
    return mapVoiceRoomDto(await apiClient.get<VoiceRoomDto>(voiceEndpoints.detail(id), options));
  },
  async create(form: VoiceRoomFormValues) {
    return mapVoiceRoomDto(await apiClient.post<VoiceRoomDto>(voiceEndpoints.list, mapVoiceRoomRequest(form)));
  },
  async join(id: string) {
    return mapVoiceTokenDto(await apiClient.post<VoiceTokenDto>(voiceEndpoints.join(id), {}));
  },
  async leave(id: string) {
    await apiClient.post(voiceEndpoints.leave(id), {});
    return id;
  },
  async close(id: string) {
    await apiClient.post(voiceEndpoints.close(id), {});
    return id;
  },
  async requestJoin(id: string) {
    return mapVoiceJoinRequestDto(
      await apiClient.post<VoiceJoinRequestDto>(voiceEndpoints.requestJoin(id), {})
    );
  },
  async getRequests(id: string, options?: RequestOptions) {
    const dto = await apiClient.get<unknown>(voiceEndpoints.requests(id), options);
    return normalizePagination<VoiceJoinRequestDto>(dto).items.map(mapVoiceJoinRequestDto);
  },
  async approveRequest(id: string, requestId: string) {
    await apiClient.post(voiceEndpoints.approve(id, requestId), {});
    return requestId;
  },
  async denyRequest(id: string, requestId: string) {
    await apiClient.post(voiceEndpoints.deny(id, requestId), {});
    return requestId;
  },
  async raiseHand(id: string) {
    await apiClient.post(voiceEndpoints.raiseHand(id), {});
  },
  async lowerHand(id: string) {
    await apiClient.delete(voiceEndpoints.raiseHand(id));
  },
  async getHands(id: string, options?: RequestOptions): Promise<VoiceHand[]> {
    return mapHands(await apiClient.get<VoiceHandDto[]>(voiceEndpoints.raiseHand(id), options));
  },
  async answerHand(id: string, userId: string, allow: boolean): Promise<VoiceHand[]> {
    return mapHands(
      await apiClient.post<VoiceHandDto[]>(
        allow ? voiceEndpoints.allowHand(id, userId) : voiceEndpoints.dismissHand(id, userId),
        {}
      )
    );
  },
};

function mapHands(items: VoiceHandDto[] | null | undefined): VoiceHand[] {
  return (Array.isArray(items) ? items : []).map((item) => ({
    userId: String(item.user_id),
    name: item.name ?? "",
    status: item.status === "allowed" ? "allowed" : "raised",
    raisedAt: item.raised_at ?? null,
  }));
}

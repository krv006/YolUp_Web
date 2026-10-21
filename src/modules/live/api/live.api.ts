import { apiClient, type RequestOptions } from "@/shared/api";
import { liveEndpoints } from "./live.endpoints";
import type {
  AttentionAnswerDto,
  AttentionResponseDto,
  FocusKind,
  FocusResponseDto,
  RoomTokenDto,
} from "./live.dto";
import { mapAttentionDto, mapFocusDto, mapRoomTokenDto } from "../lib/live.mappers";

export const liveApi = {
  async getToken(lessonId: string) {
    return mapRoomTokenDto(await apiClient.post<RoomTokenDto>(liveEndpoints.token, { lesson_id: lessonId }));
  },
  async leave(lessonId: string) {
    return apiClient.post(liveEndpoints.leave, { lesson_id: lessonId });
  },
  async getAttention(lessonId: string, options?: RequestOptions) {
    return mapAttentionDto(
      await apiClient.get<AttentionResponseDto>(liveEndpoints.attention, {
        ...options,
        query: { lesson_id: lessonId },
      })
    );
  },
  async answerAttention(checkId: string) {
    const dto = await apiClient.post<AttentionAnswerDto>(liveEndpoints.attention, { check_id: checkId });
    return { answeredAt: dto.answered_at };
  },
  async sendFocus(lessonId: string, kind: FocusKind) {
    return mapFocusDto(
      await apiClient.post<FocusResponseDto>(liveEndpoints.focus, { lesson_id: lessonId, kind })
    );
  },
  async muteAll(lessonId: string, except: string[] = []) {
    const dto = await apiClient.post<{ muted?: number }>(liveEndpoints.muteAll, {
      lesson_id: lessonId,
      ...(except.length ? { except } : {}),
    });
    return dto.muted ?? 0;
  },
  async getPresence(lessonId: string, options?: RequestOptions) {
    const dto = await apiClient.get<{ count?: number; avatars?: string[] }>(
      liveEndpoints.presence(lessonId),
      options
    );
    return { count: dto.count ?? 0, avatars: dto.avatars ?? [] };
  },
  async allowShare(lessonId: string, identity: string) {
    return apiClient.post(liveEndpoints.allowShare, { lesson_id: lessonId, identity });
  },

  async requestMic(lessonId: string) {
    return apiClient.post(liveEndpoints.requestMic, { lesson_id: lessonId });
  },

  async grantMic(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.grantMic, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  async denyMic(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ denied?: boolean } | null>(liveEndpoints.denyMic, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.denied);
  },

  async requestCamera(lessonId: string) {
    return apiClient.post(liveEndpoints.requestCamera, { lesson_id: lessonId });
  },

  async grantCamera(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.grantCamera, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  async denyCamera(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ denied?: boolean } | null>(liveEndpoints.denyCamera, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.denied);
  },

  async invite(lessonId: string, studentId?: string) {
    const dto = await apiClient.post<{ invited?: number } | null>(liveEndpoints.invite, {
      lesson_id: lessonId,
      ...(studentId ? { student_id: studentId } : {}),
    });
    return Number(dto?.invited ?? 0);
  },

  async ban(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.ban, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  async unban(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ unbanned?: boolean } | null>(liveEndpoints.unban, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.unbanned);
  },
};

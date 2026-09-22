import type {
  VoiceAccessMode,
  VoiceJoinRequest,
  VoiceJoinRequestStatus,
  VoiceRoom,
  VoiceRoomStatus,
  VoiceToken,
} from "@/shared/types";
import type {
  VoiceJoinRequestDto,
  VoiceRoomDto,
  VoiceRoomFormValues,
  VoiceTokenDto,
} from "../api/voice.dto";

export function mapVoiceRoomDto(dto: VoiceRoomDto): VoiceRoom {
  return {
    id: String(dto.id),
    courseId: String(dto.course),
    createdById: String(dto.created_by),
    createdByName: dto.created_by_name || "",
    title: dto.title || "",
    accessMode: dto.access_mode as VoiceAccessMode,
    status: dto.status as VoiceRoomStatus,
    scheduledAt: dto.scheduled_at,
    startedAt: dto.started_at,
    endedAt: dto.ended_at,
    participantCount: Number(dto.participant_count ?? 0),
    createdAt: dto.created_at,
  };
}

export function mapVoiceJoinRequestDto(dto: VoiceJoinRequestDto): VoiceJoinRequest {
  return {
    id: String(dto.id),
    roomId: String(dto.room),
    userId: String(dto.user),
    userName: dto.user_name || "",
    status: dto.status as VoiceJoinRequestStatus,
    createdAt: dto.created_at,
  };
}

export function mapVoiceTokenDto(dto: VoiceTokenDto): VoiceToken {
  return {
    token: dto.token,
    serverUrl: dto.url,
    roomName: dto.room,
    isModerator: Boolean(dto.is_moderator),
  };
}

export function mapVoiceRoomRequest(form: VoiceRoomFormValues): Record<string, unknown> {
  return {
    course: form.courseId,
    title: form.title,
    access_mode: form.accessMode,
    ...(form.scheduledAt ? { scheduled_at: form.scheduledAt } : {}),
  };
}

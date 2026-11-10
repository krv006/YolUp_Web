import type {
  AttentionCheck,
  AttentionResponseDto,
  FocusResponseDto,
  FocusResult,
  MediaMode,
  MediaModeDto,
  RoomToken,
  RoomTokenDto,
} from "../api/live.dto";

export function mapRoomTokenDto(dto: RoomTokenDto): RoomToken {
  return {
    token: dto.token,
    serverUrl: dto.url,
    roomName: dto.room,
    isTeacher: Boolean(dto.is_teacher),
    joinDelayMs: Number(dto.join_delay_ms ?? 0),
    mediaMode:
      dto.open_mic === undefined && dto.open_camera === undefined ? null : mapMediaModeDto(dto),
  };
}

export function mapMediaModeDto(dto: MediaModeDto | null | undefined): MediaMode {
  return { openMic: Boolean(dto?.open_mic), openCamera: Boolean(dto?.open_camera) };
}

export function mapAttentionDto(dto: AttentionResponseDto | null | undefined): AttentionCheck | null {
  return dto?.check ? { id: String(dto.check.id), dueAt: dto.check.due_at } : null;
}

export function mapFocusDto(dto: FocusResponseDto | null | undefined): FocusResult {
  return {
    exitCount: Number(dto?.exit_count ?? 0),
    threshold: Number(dto?.threshold ?? 0),
    parentNotified: Boolean(dto?.parent_notified),
    tracked: typeof dto?.exit_count === "number",
  };
}

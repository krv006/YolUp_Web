export type VoiceAccessModeDto = "open" | "invite_only";
export type VoiceRoomStatusDto = "scheduled" | "live" | "ended";
export type VoiceJoinRequestStatusDto = "pending" | "approved" | "denied";

export interface VoiceRoomDto {
  id: string | number;
  course: string | number;
  created_by: string | number;
  created_by_name?: string | null;
  title?: string | null;
  access_mode: VoiceAccessModeDto;
  status: VoiceRoomStatusDto;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  participant_count?: number;
  created_at: string;
}

export interface VoiceJoinRequestDto {
  id: string | number;
  room: string | number;
  user: string | number;
  user_name?: string | null;
  status: VoiceJoinRequestStatusDto;
  created_at: string;
}

export interface VoiceTokenDto {
  token: string;
  url: string;
  room: string;
  is_moderator?: boolean;
}

export interface VoiceRoomFormValues {
  courseId: string;
  title: string;
  accessMode: "open" | "invite_only";
  scheduledAt: string | null;
}

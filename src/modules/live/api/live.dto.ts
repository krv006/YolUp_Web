export interface RoomTokenDto {
  token: string;
  url: string;
  room: string;
  is_teacher: boolean;
  join_delay_ms?: number;
  open_mic?: boolean;
  open_camera?: boolean;
}

export interface MediaModeDto {
  open_mic?: boolean;
  open_camera?: boolean;
}

export interface MediaMode {
  openMic: boolean;
  openCamera: boolean;
}

export type MediaKind = "microphone" | "camera" | "screen";

export interface AttentionResponseDto {
  check: { id: string | number; due_at: string } | null;
}

export interface AttentionAnswerDto {
  answered_at: string;
}

export type FocusKind = "exit" | "return";

export interface FocusResponseDto {
  ok?: boolean;
  kind?: FocusKind;
  exit_count?: number;
  threshold?: number;
  parent_notified?: boolean;
}

export interface FocusResult {
  exitCount: number;
  threshold: number;
  parentNotified: boolean;
  tracked: boolean;
}

export interface RoomToken {
  token: string;
  serverUrl: string;
  roomName: string;
  isTeacher: boolean;
  joinDelayMs: number;
  mediaMode: MediaMode | null;
}

export interface AttentionCheck {
  id: string;
  dueAt: string;
}

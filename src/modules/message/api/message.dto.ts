import type { UserDto } from "@/shared/types";

export interface MessageAttachmentDto {
  type?: "voice" | "image" | "file";
  url?: string | null;
  name?: string | null;
  size?: number | null;
  mime?: string | null;
  page_count?: number | null;
  duration_ms?: number | null;
  waveform?: number[] | null;
}

export interface MessageReplyDto {
  id?: string | number;
  sender_name?: string;
  text?: string;
  message_type?: string;
  is_deleted?: boolean;
}

export interface MessageForwardDto {
  message_id?: string | number;
  author_id?: string | number;
  author_name?: string;
  room_id?: string | number;
}

export interface MessageAssignmentDto {
  id?: string | number;
  title?: string;
  due_at?: string | null;
  submitted_count?: number;
  total_count?: number;
}

export interface MessageCapabilitiesDto {
  edit?: boolean;
  delete?: boolean;
  delete_everyone?: boolean;
  pin?: boolean;
  react?: boolean;
  forward?: boolean;
}

export interface MessageReactionDto {
  emoji: string;
  count?: number;
  reacted?: boolean;
  user_ids?: Array<string | number>;
}

export interface MessageDto {
  id: string | number;
  room: string | number;
  sender?: UserDto;
  text: string;
  created_at: string;
  message_type?: string;
  kind?: "user" | "system";
  status?: string;
  edited_at?: string | null;
  client_message_id?: string | null;
  reply_to?: MessageReplyDto | null;
  forwarded_from?: MessageForwardDto | null;
  reactions?: MessageReactionDto[] | null;
  mentions?: Array<string | number> | null;
  attachment?: MessageAttachmentDto | null;
  assignment?: MessageAssignmentDto | null;
  capabilities?: MessageCapabilitiesDto | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  duration?: number | null;
  waveform?: number[] | null;
}

export interface MessagePageDto {
  items: MessageDto[];
  has_more?: boolean;
}

export interface MessageSearchDto {
  total?: number;
  items?: Array<{ id: string | number; text?: string; created_at?: string }>;
}

export interface PinnedMessageDto {
  message_id: string | number;
  author_name?: string;
  text?: string;
  message_type?: string;
  pinned_at?: string;
}

export interface ChatMemberDto {
  id: string | number;
  name?: string;
  username?: string;
  role?: string;
  is_online?: boolean;
  last_seen_at?: string | null;
  avatar_url?: string | null;
}

export interface SocketMessageEventDto {
  type: "message";
  message: MessageDto;
}

export interface SocketTypingEventDto {
  type: "typing";
  user_id: string | number;
  name: string;
  kind?: "text" | "voice";
}

export interface SocketErrorEventDto {
  type: "error";
  detail?: string;
}

export type SocketEventDto =
  | SocketMessageEventDto
  | SocketTypingEventDto
  | SocketErrorEventDto
  | { type: string; payload?: Record<string, unknown>; [key: string]: unknown };

export interface RoomAttachmentDto {
  id?: string | number;
  message_id?: string | number;
  name?: string;
  file_name?: string;
  size?: number | null;
  mime?: string;
  mime_type?: string;
  url?: string | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  sender?: { id?: string | number; name?: string } | null;
  created_at?: string;
}

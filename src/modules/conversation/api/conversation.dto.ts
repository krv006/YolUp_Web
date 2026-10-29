import type { DirectStatus, UserDto } from "@/shared/types";

export interface ChatRoomDto {
  id: string | number;
  kind: "course" | "direct";
  course?: string | number | null;
  title: string;
  direct_status?: DirectStatus | null;
  last_message?: {
    text?: string;
    sender?: string;
    sender_id?: string | number | null;
    message_type?: string | null;
    created_at?: string;
  } | null;
  other_user?: UserDto | null;
  unread?: number;
  unread_count?: number;
  first_unread_message_id?: string | number | null;
  last_read_message_id?: string | number | null;
  has_unread_mention?: boolean;
  is_pinned?: boolean;
  is_muted?: boolean;
  announcement_only?: boolean;
  online_count?: number;
  member_count?: number;
  pinned_messages?: Array<{
    message_id: string | number;
    author_name?: string;
    text?: string;
    message_type?: string;
    pinned_at?: string;
  }> | null;
  updated_at: string;
  image_url?: string | null;
  image?: string | null;
}

export interface DirectTeacherDto extends UserDto {
  direct_status?: DirectStatus | null;
  room_id?: string | number | null;
}

export interface DirectTeacher {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  directStatus: DirectStatus | null;
  roomId: string | null;
}

export type DirectAction = "accept" | "block";

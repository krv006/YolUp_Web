import type { CanMessage, DirectStatus, UserDto } from "@/shared/types";

export type NotificationTarget = "user" | "all" | "users" | "parents_of" | "course";

export interface NotificationDto {
  id: string;
  sender?: UserDto | null;
  description: string;
  title?: string | null;
  body?: string | null;
  target_type: NotificationTarget;
  kind?: string | null;
  link_type?: string | null;
  link_id?: string | null;
  link?: { kind?: string | null; id?: string | null } | null;
  data?: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationRecipientDto {
  id: string;
  notification: NotificationDto;
  title?: string | null;
  body?: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface SentNotificationDto {
  id: string;
  description: string;
  target_type: NotificationTarget;
  created_at: string;
  read_count: number;
  total_count: number;
}

export interface NotificationRecipientRowDto {
  user: UserDto;
  read_at: string | null;
}

export interface SendNotificationDto {
  description: string;
  target_type: NotificationTarget;
  user_id?: string;
  user_ids?: string[];
  course_id?: string;
  include_parents?: boolean;
  kind?: string;
}


export interface NotificationSender {
  id: string;
  name: string;
  username: string;
  role: string;
}

export interface NotificationLink {
  type: string;
  id: string;
}

export type OpenNotificationLink = (link: NotificationLink, kind?: string | null, data?: Record<string, unknown>) => void;

export interface InboxNotification {
  id: string;
  notificationId: string;
  sender: NotificationSender | null;
  html: string;
  title: string;
  body: string;
  targetType: NotificationTarget;
  kind: string | null;
  isRead: boolean;
  readAt: string | null;
  link: NotificationLink | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface SentNotification {
  id: string;
  html: string;
  targetType: NotificationTarget;
  createdAt: string;
  readCount: number;
  totalCount: number;
}

export interface NotificationRecipientRow {
  id: string;
  name: string;
  username: string;
  role: string;
  readAt: string | null;
}

export interface SendNotificationInput {
  description: string;
  targetType: NotificationTarget;
  userId?: string | null;
  userIds?: string[];
  courseId?: string | null;
  includeParents?: boolean;
  kind?: string;
}

export interface PersonSearchDto {
  id: string | number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  role?: string | null;
  avatar?: string | null;
  room_id?: string | number | null;
  direct_status?: DirectStatus | null;
  can_message?: CanMessage | null;
}

export interface PersonSearchResult {
  id: string;
  name: string;
  username: string;
  role: string;
  avatar: string | null;
  roomId: string | null;
  directStatus: DirectStatus | null;
  canMessage: CanMessage | null;
}

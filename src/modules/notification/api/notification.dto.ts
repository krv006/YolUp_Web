import type { UserDto } from "@/shared/types";

export type NotificationTarget = "user" | "all" | "users" | "parents_of";

export interface NotificationDto {
  id: string;
  sender?: UserDto | null;
  description: string;
  target_type: NotificationTarget;
  kind?: string | null;
  link_type?: string | null;
  link_id?: string | null;
  created_at: string;
}

export interface NotificationRecipientDto {
  id: string;
  notification: NotificationDto;
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

export type OpenNotificationLink = (link: NotificationLink, kind?: string | null) => void;

export interface InboxNotification {
  id: string;
  notificationId: string;
  sender: NotificationSender | null;
  html: string;
  targetType: NotificationTarget;
  kind: string | null;
  isRead: boolean;
  readAt: string | null;
  link: NotificationLink | null;
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
  kind?: string;
}

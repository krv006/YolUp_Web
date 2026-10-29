import { normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import { sanitizeHtml } from "@/shared/lib";
import type { UserDto } from "@/shared/types";
import type {
  InboxNotification,
  NotificationRecipientDto,
  NotificationRecipientRow,
  NotificationLink,
  NotificationRecipientRowDto,
  NotificationSender,
  SendNotificationDto,
  SendNotificationInput,
  SentNotification,
  SentNotificationDto,
} from "../api/notification.dto";

function displayName(user: UserDto | null | undefined): string {
  if (!user) return "Tizim";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Tizim";
}

export function mapNotificationLink(
  type: string | null | undefined,
  id: string | null | undefined
): NotificationLink | null {
  return type && id ? { type, id: String(id) } : null;
}

function mapSender(user: UserDto | null | undefined): NotificationSender | null {
  if (!user) return null;
  return {
    id: String(user.id),
    name: displayName(user),
    username: user.username ?? "",
    role: user.role ?? "",
  };
}

export function mapInboxNotificationDto(dto: NotificationRecipientDto): InboxNotification {
  return {
    id: String(dto.id),
    notificationId: String(dto.notification?.id ?? dto.id),
    sender: mapSender(dto.notification?.sender),
    html: sanitizeHtml(dto.notification?.description ?? ""),
    title: dto.title ?? dto.notification?.title ?? "",
    body: dto.body ?? dto.notification?.body ?? "",
    targetType: dto.notification?.target_type ?? "user",
    kind: dto.notification?.kind ?? null,
    isRead: Boolean(dto.is_read),
    readAt: dto.read_at ?? null,
    link: mapNotificationLink(dto.notification?.link_type, dto.notification?.link_id),
    createdAt: dto.created_at ?? dto.notification?.created_at ?? "",
  };
}

export function mapInboxPage(dto: unknown, options?: PaginationOptions): Page<InboxNotification> {
  const page = normalizePagination<NotificationRecipientDto>(dto, options);
  return { ...page, items: page.items.map(mapInboxNotificationDto) };
}

export function mapSentNotificationDto(dto: SentNotificationDto): SentNotification {
  return {
    id: String(dto.id),
    html: sanitizeHtml(dto.description ?? ""),
    targetType: dto.target_type ?? "all",
    createdAt: dto.created_at ?? "",
    readCount: Number(dto.read_count ?? 0),
    totalCount: Number(dto.total_count ?? 0),
  };
}

export function mapSentPage(dto: unknown, options?: PaginationOptions): Page<SentNotification> {
  const page = normalizePagination<SentNotificationDto>(dto, options);
  return { ...page, items: page.items.map(mapSentNotificationDto) };
}

export function mapRecipientRows(dto: unknown): NotificationRecipientRow[] {
  const rows = Array.isArray(dto) ? (dto as NotificationRecipientRowDto[]) : [];
  return rows.map((row) => ({
    id: String(row.user?.id ?? ""),
    name: displayName(row.user),
    username: row.user?.username ?? "",
    role: row.user?.role ?? "",
    readAt: row.read_at ?? null,
  }));
}

export function mapSendRequest(input: SendNotificationInput): SendNotificationDto {
  const bulk = input.targetType === "users" || input.targetType === "parents_of";
  return {
    description: input.description.trim(),
    target_type: input.targetType,
    ...(input.targetType === "user" && input.userId ? { user_id: input.userId } : {}),
    ...(bulk && input.userIds?.length ? { user_ids: input.userIds } : {}),
    ...(input.kind ? { kind: input.kind } : {}),
  };
}

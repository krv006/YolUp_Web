import {
  normalizeMediaUrl,
  normalizePagination,
  type Page,
  type PaginationOptions,
} from "@/shared/api";
import type { Conversation } from "@/shared/types";
import type { ChatRoomDto, DirectTeacher, DirectTeacherDto } from "../api/conversation.dto";

const TONES = ["violet", "blue", "emerald", "amber", "rose"] as const;

function toneFor(id: unknown): string {
  return TONES[Math.abs(String(id).charCodeAt(0) || 0) % TONES.length];
}

export function mapConversationDto(dto: ChatRoomDto): Conversation {
  const other = dto.other_user;
  return {
    id: String(dto.id),
    type: dto.kind === "course" ? "group" : "direct",
    kind: dto.kind,
    courseId: dto.course ? String(dto.course) : null,
    title: dto.title,
    participantId: other?.id ? String(other.id) : null,
    participant: other
      ? {
          id: String(other.id),
          username: other.username,
          name: [other.first_name, other.last_name].filter(Boolean).join(" ") || other.username,
          phone: other.phone ?? null,
        }
      : null,
    directStatus: dto.direct_status ?? null,
    lastMessage: dto.last_message?.text ?? "Hozircha xabar yo‘q",
    lastSender: dto.last_message?.sender ?? null,
    updatedAt: dto.last_message?.created_at ?? dto.updated_at,
    unreadCount: Number(dto.unread_count ?? dto.unread ?? 0),
    status: "offline",
    typing: false,
    avatarTone: toneFor(dto.id),
    memberCount: Number(dto.member_count ?? 0),
    imageUrl: normalizeMediaUrl(dto.image_url ?? dto.image ?? null),
    isPinned: Boolean(dto.is_pinned),
    isMuted: Boolean(dto.is_muted),
    hasUnreadMention: Boolean(dto.has_unread_mention),
    announcementOnly: Boolean(dto.announcement_only),
    onlineCount: Number(dto.online_count ?? 0),
    firstUnreadMessageId: dto.first_unread_message_id
      ? String(dto.first_unread_message_id)
      : null,
    lastReadMessageId: dto.last_read_message_id ? String(dto.last_read_message_id) : null,
    pinnedMessages: (dto.pinned_messages ?? []).map((item) => ({
      messageId: String(item.message_id),
      authorName: item.author_name ?? "",
      text: item.text ?? "",
      messageType: item.message_type ?? "text",
      pinnedAt: item.pinned_at ?? "",
    })),
  };
}

export function mapConversationPage(dto: unknown, options?: PaginationOptions): Page<Conversation> {
  const page = normalizePagination<ChatRoomDto>(dto, options);
  return { ...page, items: page.items.map(mapConversationDto) };
}

export function mapTeacherDto(dto: DirectTeacherDto): DirectTeacher {
  return {
    id: String(dto.id),
    username: dto.username,
    name: [dto.first_name, dto.last_name].filter(Boolean).join(" ") || dto.username,
    phone: dto.phone ?? null,
    directStatus: dto.direct_status ?? null,
    roomId: dto.room_id ? String(dto.room_id) : null,
  };
}

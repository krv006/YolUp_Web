import type {
  ChatMember,
  ChatMessage,
  MessageCapabilities,
  PinnedChatMessage,
  UserDto,
} from "@/shared/types";
import { normalizeMediaUrl } from "@/shared/api";
import type {
  ChatMemberDto,
  MessageDto,
  MessageReactionDto,
  PinnedMessageDto,
} from "../api/message.dto";

const REPLY_PATTERN = /^↪ ([^:]+): (.*?)\n([\s\S]*)$/;

function mapCapabilities(dto: MessageDto, currentUserId?: string | null): MessageCapabilities {
  const raw = dto.capabilities;
  if (!raw) {
    const mine = currentUserId ? String(dto.sender?.id ?? "") === String(currentUserId) : false;
    return {
      reply: true,
      edit: mine,
      delete: true,
      deleteEveryone: mine,
      pin: false,
      react: true,
      forward: true,
    };
  }
  return {
    reply: true,
    edit: Boolean(raw.edit),
    delete: raw.delete !== false,
    deleteEveryone: Boolean(raw.delete_everyone),
    pin: Boolean(raw.pin),
    react: raw.react !== false,
    forward: raw.forward !== false,
  };
}

function mapReactions(items: MessageReactionDto[] | null | undefined, currentUserId?: string | null) {
  if (!items?.length) return undefined;
  return items.map((item) => ({
    emoji: item.emoji,
    count: item.count ?? item.user_ids?.length ?? 0,
    reacted:
      typeof item.reacted === "boolean"
        ? item.reacted
        : Boolean(
            currentUserId && (item.user_ids ?? []).some((id) => String(id) === String(currentUserId))
          ),
  }));
}

export function mapMessageDto(dto: MessageDto, currentUserId?: string | null): ChatMessage {
  const sender = dto.sender ?? ({} as UserDto);
  const legacyReply = String(dto.text ?? "").match(REPLY_PATTERN);
  const attachment = dto.attachment;
  const hasFile = Boolean(attachment?.url || dto.file_url);
  const messageType = dto.message_type || (dto.kind === "system" ? "system" : "text");

  return {
    id: String(dto.id),
    conversationId: String(dto.room),
    senderId: String(sender.id ?? ""),
    senderName: [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.username,
    senderUsername: sender.username,
    senderRole: sender.role,
    text: dto.reply_to ? dto.text : legacyReply ? legacyReply[3] : dto.text,
    replyTo: dto.reply_to
      ? { author: dto.reply_to.sender_name ?? "", text: dto.reply_to.text ?? "" }
      : legacyReply
        ? { author: legacyReply[1], text: legacyReply[2] }
        : undefined,
    replyToId: dto.reply_to?.id ? String(dto.reply_to.id) : null,
    replyToDeleted: Boolean(dto.reply_to?.is_deleted),
    type: dto.kind === "system" ? "system" : messageType,
    createdAt: dto.created_at,
    status: dto.status ?? "sent",
    pending: false,
    failed: false,
    editedAt: dto.edited_at ?? null,
    clientMessageId: dto.client_message_id ?? null,
    mentions: (dto.mentions ?? []).map(String),
    capabilities: mapCapabilities(dto, currentUserId),
    reactions: mapReactions(dto.reactions, currentUserId),
    forwardedFrom: dto.forwarded_from
      ? {
          messageId: String(dto.forwarded_from.message_id ?? ""),
          authorId: String(dto.forwarded_from.author_id ?? ""),
          authorName: dto.forwarded_from.author_name ?? "",
          roomId: String(dto.forwarded_from.room_id ?? ""),
        }
      : null,
    assignment: dto.assignment
      ? {
          id: String(dto.assignment.id ?? ""),
          title: dto.assignment.title ?? "",
          dueAt: dto.assignment.due_at ?? null,
          submittedCount: dto.assignment.submitted_count ?? 0,
          totalCount: dto.assignment.total_count ?? 0,
        }
      : null,
    attachment: hasFile
      ? {
          messageId: String(dto.id),
          name: attachment?.name || dto.file_name || "Fayl",
          mimeType: attachment?.mime || dto.file_type || "",
          url: normalizeMediaUrl(attachment?.url ?? dto.file_url ?? null),
          size: attachment?.size ?? dto.file_size ?? null,
          pageCount: attachment?.page_count ?? null,
          durationMs:
            attachment?.duration_ms ?? (dto.duration ? Number(dto.duration) * 1000 : null),
          waveform: attachment?.waveform ?? dto.waveform ?? undefined,
          kind:
            attachment?.type ??
            (messageType === "voice" ? "voice" : messageType === "image" ? "image" : "file"),
        }
      : undefined,
  };
}

export function mapPinnedDto(dto: PinnedMessageDto): PinnedChatMessage {
  return {
    messageId: String(dto.message_id),
    authorName: dto.author_name ?? "",
    text: dto.text ?? "",
    messageType: dto.message_type ?? "text",
    pinnedAt: dto.pinned_at ?? "",
  };
}

export function mapChatMemberDto(dto: ChatMemberDto): ChatMember {
  return {
    id: String(dto.id),
    name: dto.name ?? dto.username ?? "",
    username: dto.username ?? "",
    role: dto.role ?? "student",
    isOnline: Boolean(dto.is_online),
    avatarUrl: normalizeMediaUrl(dto.avatar_url ?? null),
  };
}

export type ParsedSocketEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "typing"; userId: string; name: string }
  | { type: "removed" }
  | { type: "edited"; messageId: string; text: string; editedAt: string | null }
  | { type: "deleted"; messageIds: string[]; scope: "me" | "everyone" }
  | { type: "reaction"; messageId: string; reactions: MessageReactionDto[] }
  | { type: "pinned" }
  | { type: "read"; userId: string }
  | { type: "roomUpdated" }
  | { type: "error"; detail: string };

interface RawSocketEvent {
  type?: string;
  payload?: Record<string, unknown>;
  message?: MessageDto;
  user_id?: string | number;
  name?: string;
  detail?: string;
  [key: string]: unknown;
}

export function parseSocketEvent(raw: unknown, currentUserId?: string | null): ParsedSocketEvent | null {
  const event = (typeof raw === "string" ? JSON.parse(raw) : raw) as RawSocketEvent | null;
  if (!event?.type) return null;
  const payload = (event.payload ?? event) as Record<string, unknown>;

  switch (event.type) {
    case "message":
      return event.message ? { type: "message", message: mapMessageDto(event.message, currentUserId) } : null;
    case "typing":
      return { type: "typing", userId: String(event.user_id), name: event.name ?? "" };
    case "removed":
      return { type: "removed" };
    case "message_edited":
      return {
        type: "edited",
        messageId: String(payload.id ?? payload.message_id ?? ""),
        text: String(payload.text ?? ""),
        editedAt: (payload.edited_at as string) ?? null,
      };
    case "messages_removed":
      return {
        type: "deleted",
        messageIds: ((payload.message_ids as Array<string | number>) ?? []).map(String),
        scope: payload.scope === "everyone" ? "everyone" : "me",
      };
    case "message_deleted":
      return {
        type: "deleted",
        messageIds: [String(payload.id ?? payload.message_id ?? "")].filter(Boolean),
        scope: "everyone",
      };
    case "message_reaction":
      return {
        type: "reaction",
        messageId: String(payload.message_id ?? ""),
        reactions: (payload.reactions as MessageReactionDto[]) ?? [],
      };
    case "room_pinned_changed":
    case "pinned":
      return { type: "pinned" };
    case "read":
    case "room_read":
      return { type: "read", userId: String(payload.user_id ?? "") };
    case "room_updated":
      return { type: "roomUpdated" };
    case "error":
      return { type: "error", detail: event.detail || "WebSocket xatosi" };
    default:
      return null;
  }
}

export function upsertMessage(messages: ChatMessage[] = [], message: ChatMessage): ChatMessage[] {
  const index = messages.findIndex(
    (item) =>
      item.id === message.id ||
      (Boolean(message.clientMessageId) && item.clientMessageId === message.clientMessageId)
  );
  if (index >= 0) return messages.map((item, i) => (i === index ? { ...item, ...message } : item));
  return [...messages, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function markMessageFailed(messages: ChatMessage[] = [], temporaryId: string): ChatMessage[] {
  return messages.map((item) =>
    item.id === temporaryId ? { ...item, pending: false, failed: true, status: "failed" } : item
  );
}

export function applyReactions(
  messages: ChatMessage[] = [],
  messageId: string,
  reactions: MessageReactionDto[],
  currentUserId?: string | null
): ChatMessage[] {
  return messages.map((item) =>
    item.id === messageId
      ? { ...item, reactions: mapReactions(reactions, currentUserId) ?? [] }
      : item
  );
}

import { RealtimeSocket, type SocketState } from "@/shared/api";
import { sanitizeHtml } from "@/shared/lib";
import { mapNotificationLink } from "./notification.mappers";
import type { NotificationDto, NotificationLink, NotificationTarget } from "../api/notification.dto";

export type { SocketState };

export interface LiveNotification {
  id: string;
  html: string;
  targetType: NotificationTarget;
  kind: string | null;
  senderName: string;
  link: NotificationLink | null;
  createdAt: string;
}

export type RealtimeEvent =
  | { type: "notification"; notification: LiveNotification }
  | { type: "chatActivity"; roomId: string; messageId: string; senderId: string | null; createdAt: string }
  | { type: "chatTyping"; roomId: string; userId: string; name: string; kind: "text" | "voice" };

interface RawEvent {
  type?: string;
  notification?: NotificationDto;
  room?: string | number;
  message_id?: string | number;
  sender_id?: string | number | null;
  user_id?: string | number;
  name?: string;
  kind?: string;
  created_at?: string;
}

function readEvent(raw: unknown): RawEvent | null {
  const event = typeof raw === "string" ? JSON.parse(raw) : raw;
  return event && typeof event === "object" ? (event as RawEvent) : null;
}

export function parseRealtimeEvent(raw: unknown): RealtimeEvent | null {
  const event = readEvent(raw);
  if (!event) return null;
  if (event.type === "notification") {
    const notification = parseNotificationEvent(event);
    return notification ? { type: "notification", notification } : null;
  }
  if (event.type === "chat_activity" && event.room != null) {
    return {
      type: "chatActivity",
      roomId: String(event.room),
      messageId: event.message_id == null ? "" : String(event.message_id),
      senderId: event.sender_id == null ? null : String(event.sender_id),
      createdAt: event.created_at ?? "",
    };
  }
  if (event.type === "chat_typing" && event.room != null) {
    return {
      type: "chatTyping",
      roomId: String(event.room),
      userId: event.user_id == null ? "" : String(event.user_id),
      name: event.name ?? "",
      kind: event.kind === "voice" ? "voice" : "text",
    };
  }
  return null;
}

export function parseNotificationEvent(raw: unknown): LiveNotification | null {
  const event = readEvent(raw);
  const dto = event?.type === "notification" ? event.notification : null;
  if (!dto) return null;

  const sender = dto.sender;
  return {
    id: String(dto.id),
    html: sanitizeHtml(dto.description ?? ""),
    targetType: dto.target_type ?? "user",
    kind: dto.kind ?? null,
    link: mapNotificationLink(dto.link_type, dto.link_id),
    senderName:
      [sender?.first_name, sender?.last_name].filter(Boolean).join(" ") ||
      sender?.username ||
      "Tizim",
    createdAt: dto.created_at ?? "",
  };
}

export interface NotificationSocketManagerInit {
  onNotification?: (notification: LiveNotification) => void;
  onEvent?: (event: RealtimeEvent) => void;
  onState?: (state: SocketState) => void;
}

export class NotificationSocketManager {
  private readonly socket: RealtimeSocket;

  constructor({ onNotification, onEvent, onState }: NotificationSocketManagerInit) {
    this.socket = new RealtimeSocket({
      path: "/ws/notifications/",
      onState,
      onMessage: (raw) => {
        try {
          const parsed = parseRealtimeEvent(raw);
          if (!parsed) return;
          if (parsed.type === "notification") onNotification?.(parsed.notification);
          onEvent?.(parsed);
        } catch (error) {
          void error;
        }
      },
    });
  }

  start(): void {
    this.socket.start();
  }

  stop(): void {
    this.socket.stop();
  }
}

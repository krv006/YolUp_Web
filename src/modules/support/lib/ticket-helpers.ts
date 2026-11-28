import { storage } from "@/shared/lib";
import type { SupportMessage, SupportTicket } from "../api/support.dto";

const SEEN_KEY = "yolup:help:seen";

type SeenMap = Record<string, string>;

function seenMap(): SeenMap {
  const value = storage.getJson<unknown>(SEEN_KEY, {});
  return value && typeof value === "object" ? (value as SeenMap) : {};
}

export function lastStaffMessage(ticket: Pick<SupportTicket, "messages">): SupportMessage | null {
  for (let index = ticket.messages.length - 1; index >= 0; index -= 1) {
    if (ticket.messages[index].fromStaff) return ticket.messages[index];
  }
  return null;
}

export function ticketUnread(ticket: SupportTicket): boolean {
  if (ticket.unread !== null) return ticket.unread;
  if (ticket.status !== "answered") return false;
  const seen = seenMap()[ticket.id];
  return !seen || new Date(ticket.updatedAt).getTime() > new Date(seen).getTime();
}

export function markTicketSeen(ticket: Pick<SupportTicket, "id" | "updatedAt">): void {
  const map = seenMap();
  if (map[ticket.id] === ticket.updatedAt) return;
  storage.setJson(SEEN_KEY, { ...map, [ticket.id]: ticket.updatedAt });
}

export function ticketLabel(ticket: Pick<SupportTicket, "number">): string {
  return ticket.number ? `#${ticket.number}` : "";
}

export function staffName(ticket: Pick<SupportTicket, "messages">): string {
  return lastStaffMessage(ticket)?.author.split(" ")[0] ?? "";
}

export const MIN_DESCRIPTION = 20;
export const TICKET_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"];

export function fileProblem(file: File, maxMb: number): "size" | "type" | null {
  if (!TICKET_FILE_TYPES.includes(file.type)) return "type";
  if (file.size > maxMb * 1024 * 1024) return "size";
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0).replace(".", ",")} MB`;
}

export function deviceInfo(): string {
  if (typeof navigator === "undefined") return "";
  const screenSize = typeof window === "undefined" ? "" : `${window.screen.width}x${window.screen.height}`;
  return JSON.stringify({
    user_agent: navigator.userAgent,
    language: navigator.language,
    platform: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform,
    screen: screenSize,
    url: typeof location === "undefined" ? "" : location.href,
  });
}

export type TicketFilter = "all" | "open" | "answered" | "closed";

export function filterTickets(tickets: readonly SupportTicket[], filter: TicketFilter): SupportTicket[] {
  return filter === "all" ? [...tickets] : tickets.filter((ticket) => ticket.status === filter);
}

export function groupTickets(tickets: readonly SupportTicket[], now: Date, monthName: (date: Date) => string, thisWeek: string) {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const groups: Array<{ label: string; items: SupportTicket[] }> = [];
  for (const ticket of [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const date = new Date(ticket.updatedAt || ticket.createdAt);
    const label = date.getTime() >= weekAgo ? thisWeek : monthName(date);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(ticket);
    else groups.push({ label, items: [ticket] });
  }
  return groups;
}

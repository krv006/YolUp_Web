import type { ConversationRole } from "@/shared/types";

export const messageKeys = Object.freeze({
  all: (conversationId: string, role: ConversationRole = "teacher") =>
    ["conversations", role, conversationId, "messages"] as const,
  pinned: (conversationId: string) => ["conversations", conversationId, "pinned"] as const,
  members: (conversationId: string, query = "") =>
    ["conversations", conversationId, "members", query] as const,
  search: (conversationId: string, query: string) =>
    ["conversations", conversationId, "search", query] as const,
});

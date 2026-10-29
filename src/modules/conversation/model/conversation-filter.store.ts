import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";
import type { Conversation } from "@/shared/types";

export type ConversationFilter = "all" | "direct" | "group";

const FILTERS: ReadonlySet<string> = new Set<ConversationFilter>(["all", "direct", "group"]);

export function matchesConversationFilter(
  conversation: Conversation,
  filter: ConversationFilter
): boolean {
  if (filter === "all") return true;
  return conversation.type === filter;
}

export function countUnreadChats(conversations: Conversation[], filter: ConversationFilter): number {
  return conversations.filter((item) => item.unreadCount > 0 && matchesConversationFilter(item, filter)).length;
}

interface ConversationFilterState {
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
}

export const useConversationFilterStore = create<ConversationFilterState>()(
  persist(
    (set) => ({
      filter: "all",
      setFilter: (filter) => set({ filter }),
    }),
    { name: STORAGE_KEYS.CONVERSATION_FILTER }
  )
);

export function useConversationFilter() {
  const stored = useConversationFilterStore((state) => state.filter);
  const filter: ConversationFilter = FILTERS.has(stored) ? stored : "all";
  const setFilter = useConversationFilterStore((state) => state.setFilter);
  return { filter, setFilter };
}

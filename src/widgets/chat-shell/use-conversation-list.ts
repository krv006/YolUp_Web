import { useMemo, useState } from "react";
import {
  matchesConversationFilter,
  useConversationFilter,
  useConversations,
  type ConversationFilter,
} from "@/modules/conversation";
import { useUserSearch } from "@/modules/notification";

export const CONVERSATION_FILTERS: ConversationFilter[] = ["all", "group", "direct", "unread"];

export function useConversationList() {
  const { filter, setFilter } = useConversationFilter();
  const [search, setSearch] = useState("");
  const { data = [], isLoading, isError, refetch } = useConversations("teacher");

  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    const rows = data
      .filter((item) => matchesConversationFilter(item, filter))
      .filter((item) => (query ? item.title.toLowerCase().includes(query) : true));
    return [...rows].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [data, filter, query]);

  const people = useUserSearch(query);
  const peopleRows = useMemo(() => {
    const known = new Set(data.map((item) => item.id));
    return (people.data ?? []).filter((person) => !person.roomId || !known.has(person.roomId));
  }, [people.data, data]);

  const unreadTotal = data.reduce((sum, item) => sum + (item.unreadCount > 0 ? 1 : 0), 0);

  return {
    data,
    isLoading,
    isError,
    refetch,
    filter,
    setFilter,
    search,
    setSearch,
    query,
    visible,
    peopleRows,
    unreadTotal,
  };
}

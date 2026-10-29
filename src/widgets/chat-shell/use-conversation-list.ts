import { useMemo, useState } from "react";
import {
  countUnreadChats,
  matchesConversationFilter,
  useConversationFilter,
  useConversations,
  type ConversationFilter,
} from "@/modules/conversation";
import { useIsStudent } from "@/modules/auth";
import { useUserSearch } from "@/modules/notification";

export const CONVERSATION_FILTERS: ConversationFilter[] = ["all", "group", "direct"];

export function useConversationList() {
  const { filter, setFilter } = useConversationFilter();
  const [search, setSearch] = useState("");
  const { data = [], isLoading, isError, refetch } = useConversations(useIsStudent() ? "student" : "teacher");

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
  const unreadByFilter = useMemo(
    () =>
      Object.fromEntries(CONVERSATION_FILTERS.map((id) => [id, countUnreadChats(data, id)])) as Record<
        ConversationFilter,
        number
      >,
    [data]
  );

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
    unreadByFilter,
  };
}

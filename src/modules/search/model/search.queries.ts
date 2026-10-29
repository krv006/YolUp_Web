import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search.api";
import type { SearchType } from "../api/search.dto";

export const searchKeys = {
  all: ["search"] as const,
  query: (q: string, type: SearchType | "all") => [...searchKeys.all, type, q] as const,
};

export const SEARCH_MIN_QUERY = 2;

export function useGlobalSearch(term: string, type: SearchType | "all" = "all", enabled = true) {
  const value = term.trim();
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = globalThis.setTimeout(() => setDebounced(value), 300);
    return () => globalThis.clearTimeout(id);
  }, [value]);

  const active = enabled && value.length >= SEARCH_MIN_QUERY;
  const ready = active && debounced.length >= SEARCH_MIN_QUERY;
  const key = debounced.toLowerCase();

  const all = useQuery({
    queryKey: searchKeys.query(key, "all"),
    queryFn: ({ signal }) => searchApi.search(debounced, "all", { signal }),
    enabled: ready,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  const single = useQuery({
    queryKey: searchKeys.query(key, type),
    queryFn: ({ signal }) => searchApi.search(debounced, type, { signal }),
    enabled: ready && type !== "all",
    staleTime: 30_000,
  });

  const fallback = (all.data?.items ?? []).filter((item) => type === "all" || item.type === type);
  const items = !active ? [] : type === "all" ? fallback : (single.data?.items ?? fallback);
  const loading = active && (value !== debounced || all.isPending || (type !== "all" && single.isPending));

  return { active, items, counts: active ? (all.data?.counts ?? {}) : {}, loading };
}

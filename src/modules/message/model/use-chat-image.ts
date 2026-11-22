import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

const LOCAL = /^(blob:|data:)/i;
const watched = new WeakSet<QueryClient>();

export function chatImageUrl(url: string | null | undefined, thumb: boolean): string | null {
  if (!url) return null;
  if (LOCAL.test(url) || !thumb || /[?&]thumb=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}thumb=1`;
}

function releaseRemovedImages(client: QueryClient) {
  if (watched.has(client)) return;
  watched.add(client);
  client.getQueryCache().subscribe((event) => {
    if (event.type !== "removed") return;
    const [scope, kind] = event.query.queryKey as unknown[];
    const data = event.query.state.data;
    if (scope === "chat" && kind === "image" && typeof data === "string") URL.revokeObjectURL(data);
  });
}

export function useChatImage(url: string | null | undefined, { thumb = false }: { thumb?: boolean } = {}) {
  const client = useQueryClient();
  releaseRemovedImages(client);
  const target = chatImageUrl(url, thumb);
  const local = Boolean(target && LOCAL.test(target));
  const query = useQuery({
    queryKey: ["chat", "image", target],
    queryFn: async ({ signal }) =>
      URL.createObjectURL(await apiClient.get<Blob>(target as string, { signal, responseType: "blob" })),
    enabled: Boolean(target) && !local,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: 1,
  });
  const src = local ? target : (query.data ?? null);
  return { src, failed: !local && query.isError, loading: !local && !src && !query.isError };
}

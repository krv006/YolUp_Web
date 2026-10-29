import { apiClient, normalizeMediaUrl, type RequestOptions } from "@/shared/api";
import { searchEndpoints } from "./search.endpoints";
import type { SearchHit, SearchHitDto, SearchResponseDto, SearchResults, SearchType } from "./search.dto";

function idOrNull(value: string | number | null | undefined): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function mapHit(dto: SearchHitDto): SearchHit {
  return {
    type: dto.type,
    id: String(dto.id),
    title: dto.title ?? "",
    subtitle: dto.subtitle ?? "",
    startsAt: dto.starts_at ?? null,
    status: dto.status ?? null,
    roomId: idOrNull(dto.room_id),
    messageId: idOrNull(dto.message_id),
    sender: dto.sender ?? "",
    createdAt: dto.created_at ?? null,
    role: dto.role ?? null,
    avatarUrl: normalizeMediaUrl(dto.avatar ?? null),
  };
}

export const searchApi = {
  async search(q: string, type: SearchType | "all" = "all", options?: RequestOptions): Promise<SearchResults> {
    const dto = await apiClient.get<SearchResponseDto>(searchEndpoints.search, {
      ...options,
      query: type === "all" ? { q, type } : { q, type, page_size: 50 },
    });
    return { items: (dto.results ?? []).map(mapHit), counts: dto.counts ?? {} };
  },
};

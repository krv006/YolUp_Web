import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { supportEndpoints } from "./support.endpoints";
import type {
  FaqItem,
  FaqItemDto,
  HelpVideo,
  HelpVideoDto,
  SupportTicket,
  SupportTicketDto,
  SupportTicketStatus,
} from "./support.dto";

const STATUSES: SupportTicketStatus[] = ["open", "answered", "closed"];

function mapTicket(dto: SupportTicketDto): SupportTicket {
  return {
    id: String(dto.id),
    subject: dto.subject ?? "",
    status: STATUSES.includes(dto.status as SupportTicketStatus) ? (dto.status as SupportTicketStatus) : "open",
    createdAt: dto.created_at ?? "",
    updatedAt: dto.updated_at ?? dto.created_at ?? "",
    lastMessage: dto.last_message ?? "",
    messages: (dto.messages ?? []).map((item) => ({
      id: String(item.id),
      body: item.body ?? "",
      fromStaff: Boolean(item.from_staff),
      author: item.author ?? "",
      createdAt: item.created_at ?? "",
    })),
  };
}

function list<T>(dto: unknown): T[] {
  return Array.isArray(dto) ? (dto as T[]) : normalizePagination<T>(dto).items;
}

export const supportApi = {
  async getTickets(filters: { all?: boolean; status?: SupportTicketStatus | null } = {}, options?: RequestOptions) {
    return list<SupportTicketDto>(
      await apiClient.get(supportEndpoints.tickets, {
        ...options,
        query: { all: filters.all ? 1 : undefined, status: filters.status || undefined },
      })
    ).map(mapTicket);
  },
  async getTicket(id: string, options?: RequestOptions) {
    return mapTicket(await apiClient.get<SupportTicketDto>(supportEndpoints.ticket(id), options));
  },
  async createTicket(input: { subject: string; message: string }) {
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.tickets, input));
  },
  async reply(id: string, message: string) {
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.reply(id), { message }));
  },
  async close(id: string) {
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.close(id), {}));
  },
  async getVideos(options?: RequestOptions): Promise<HelpVideo[]> {
    return list<HelpVideoDto>(await apiClient.get(supportEndpoints.videos, options))
      .map((item) => ({
        id: String(item.id),
        title: item.title ?? "",
        url: item.url ?? "",
        durationSeconds: item.duration_seconds ?? null,
      }))
      .filter((item) => item.url);
  },
  async getFaq(options?: RequestOptions): Promise<FaqItem[]> {
    return list<FaqItemDto>(await apiClient.get(supportEndpoints.faq, options))
      .map((item) => ({ id: String(item.id), question: item.question ?? "", answer: item.answer ?? "" }))
      .filter((item) => item.question);
  },
};

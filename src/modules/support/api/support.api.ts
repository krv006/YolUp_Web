import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { supportEndpoints } from "./support.endpoints";
import type {
  ArticleFeedback,
  FaqItem,
  FaqItemDto,
  HelpConfig,
  HelpConfigDto,
  HelpVideo,
  HelpVideoDto,
  SupportAttachmentDto,
  SupportRating,
  SupportTicket,
  SupportTicketDto,
  SupportTicketStatus,
  TicketDraft,
} from "./support.dto";

const STATUSES: SupportTicketStatus[] = ["open", "answered", "closed"];
const UPLOAD_TIMEOUT_MS = 180_000;

function mapAttachments(items: SupportAttachmentDto[] | null | undefined) {
  return (items ?? [])
    .map((item) => ({
      id: String(item.id),
      name: item.name ?? "",
      size: item.size ?? null,
      mime: item.mime ?? "",
      url: item.url ?? "",
    }))
    .filter((item) => item.url);
}

export function mapTicket(dto: SupportTicketDto): SupportTicket {
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
      attachments: mapAttachments(item.attachments),
    })),
    number: dto.number == null || dto.number === "" ? null : String(dto.number),
    category: dto.category || null,
    queuePosition: dto.queue_position ?? null,
    queueMinutes: dto.queue_minutes ?? null,
    unread: dto.unread ?? null,
    rateable: "rating" in dto,
    rating: dto.rating?.stars
      ? { stars: dto.rating.stars, tags: dto.rating.tags ?? [], comment: dto.rating.comment ?? "" }
      : null,
  };
}

export function mapHelpConfig(dto: HelpConfigDto): HelpConfig {
  return {
    online: dto.online ?? null,
    replyMinutes: dto.reply_minutes ?? null,
    hours: dto.hours ?? "",
    telegram: dto.telegram ?? "",
    telegramUrl: dto.telegram_url || (dto.telegram ? `https://t.me/${dto.telegram.replace(/^@/, "")}` : ""),
    phone: dto.phone ?? "",
    attachmentsMaxMb: dto.attachments?.max_mb ?? 0,
    attachmentsMaxFiles: dto.attachments?.max_files ?? 5,
  };
}

function list<T>(dto: unknown): T[] {
  return Array.isArray(dto) ? (dto as T[]) : normalizePagination<T>(dto).items;
}

function withFiles(fields: Record<string, string>, files: readonly File[]): FormData | Record<string, string> {
  if (!files.length) return fields;
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  files.forEach((file) => body.append("attachments", file));
  return body;
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
  async createDraft(draft: TicketDraft, onUploadProgress?: (fraction: number) => void) {
    const fields: Record<string, string> = { subject: draft.subject, message: draft.message, category: draft.category };
    if (draft.deviceInfo) fields.device_info = draft.deviceInfo;
    const body = withFiles(fields, draft.files);
    const options = body instanceof FormData ? { timeoutMs: UPLOAD_TIMEOUT_MS, onUploadProgress } : undefined;
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.tickets, body, options));
  },
  async reply(id: string, message: string, files: readonly File[] = []) {
    const body = withFiles({ message }, files);
    const options = body instanceof FormData ? { timeoutMs: UPLOAD_TIMEOUT_MS } : undefined;
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.reply(id), body, options));
  },
  async close(id: string) {
    return mapTicket(await apiClient.post<SupportTicketDto>(supportEndpoints.close(id), {}));
  },
  async rate(id: string, rating: SupportRating) {
    return mapTicket(
      await apiClient.post<SupportTicketDto>(supportEndpoints.rate(id), {
        stars: rating.stars,
        tags: rating.tags,
        comment: rating.comment,
      })
    );
  },
  async getConfig(options?: RequestOptions) {
    return mapHelpConfig(await apiClient.get<HelpConfigDto>(supportEndpoints.config, options));
  },
  async sendFeedback(feedback: ArticleFeedback) {
    await apiClient.post(supportEndpoints.feedback, {
      article: feedback.article,
      helpful: feedback.helpful,
      reason: feedback.reason ?? "",
      comment: feedback.comment ?? "",
      language: feedback.language,
    });
  },
  async getVideos(options?: RequestOptions): Promise<HelpVideo[]> {
    return list<HelpVideoDto>(await apiClient.get(supportEndpoints.videos, options))
      .map((item) => ({
        id: String(item.id),
        title: item.title ?? "",
        url: item.url ?? "",
        durationSeconds: item.duration_seconds || null,
        description: item.description ?? "",
        category: item.category || null,
      }))
      .filter((item) => item.url);
  },
  async getFaq(options?: RequestOptions): Promise<FaqItem[]> {
    return list<FaqItemDto>(await apiClient.get(supportEndpoints.faq, options))
      .map((item) => ({ id: String(item.id), question: item.question ?? "", answer: item.answer ?? "" }))
      .filter((item) => item.question);
  },
};

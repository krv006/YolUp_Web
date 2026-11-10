import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import type { DirectStatus } from "@/shared/types";
import type { SpamReason } from "./conversation.dto";

export type SpamReportStatus = "open" | "resolved" | "dismissed";
export type SpamReportAction = "resolve" | "dismiss" | "unblock";

interface ReportPersonDto {
  id: string | number;
  name?: string | null;
  username?: string | null;
  role?: string | null;
}

export interface SpamReportDto {
  id: string | number;
  room_id: string | number;
  reporter: ReportPersonDto;
  reported: ReportPersonDto;
  reason: SpamReason;
  comment?: string | null;
  status: SpamReportStatus;
  room_status?: DirectStatus | null;
  created_at: string;
  handled_by?: ReportPersonDto | null;
  handled_at?: string | null;
  recent_messages?: Array<{ sender_id: string | number; text?: string | null; created_at: string }>;
}

export interface ReportPerson {
  id: string;
  name: string;
  username: string;
  role: string;
}

export interface SpamReport {
  id: string;
  roomId: string;
  reporter: ReportPerson;
  reported: ReportPerson;
  reason: SpamReason;
  comment: string;
  status: SpamReportStatus;
  roomStatus: DirectStatus | null;
  createdAt: string;
  handledBy: ReportPerson | null;
  handledAt: string | null;
  recentMessages: Array<{ senderId: string; text: string; createdAt: string }>;
}

function mapPerson(dto: ReportPersonDto): ReportPerson {
  return {
    id: String(dto.id),
    name: dto.name || dto.username || "",
    username: dto.username ?? "",
    role: (dto.role ?? "").toLowerCase(),
  };
}

export function mapSpamReportDto(dto: SpamReportDto): SpamReport {
  return {
    id: String(dto.id),
    roomId: String(dto.room_id),
    reporter: mapPerson(dto.reporter),
    reported: mapPerson(dto.reported),
    reason: dto.reason,
    comment: dto.comment ?? "",
    status: dto.status,
    roomStatus: dto.room_status ?? null,
    createdAt: dto.created_at,
    handledBy: dto.handled_by ? mapPerson(dto.handled_by) : null,
    handledAt: dto.handled_at ?? null,
    recentMessages: (dto.recent_messages ?? []).map((item) => ({
      senderId: String(item.sender_id),
      text: item.text ?? "",
      createdAt: item.created_at,
    })),
  };
}

export const REPORTS_PAGE_SIZE = 20;

const ENDPOINTS = Object.freeze({
  list: "/api/v1/admin/reports/",
  detail: (id: string) => `/api/v1/admin/reports/${id}/`,
  action: (id: string, action: SpamReportAction) => `/api/v1/admin/reports/${id}/${action}/`,
});

export const spamReportApi = {
  async list(status: SpamReportStatus, page = 1, options: RequestOptions = {}) {
    const query = { status, page };
    const result = normalizePagination<SpamReportDto>(await apiClient.get(ENDPOINTS.list, { ...options, query }), {
      page,
      pageSize: REPORTS_PAGE_SIZE,
    });
    return { ...result, items: result.items.map(mapSpamReportDto) };
  },
  async get(id: string, options?: RequestOptions) {
    return mapSpamReportDto(await apiClient.get<SpamReportDto>(ENDPOINTS.detail(id), options));
  },
  async act(id: string, action: SpamReportAction) {
    return mapSpamReportDto(await apiClient.post<SpamReportDto>(ENDPOINTS.action(id, action), {}));
  },
};

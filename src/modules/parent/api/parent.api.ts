import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { attendanceApi } from "@/modules/attendance";
import { homeworkApi } from "@/modules/homework";
import { authEndpoints, type CreateChildRequestDto, type LinkAction } from "@/modules/auth";
import type { Assignment } from "@/shared/types";
import type {
  ChildRankDto,
  ChildSessionDto,
  ChildSummaryDto,
  ChildrenSummaryDto,
  Consent,
  ConsentDto,
  ParentLinkDto,
  SetConsentInput,
  UsernameAvailability,
} from "./parent.dto";
import { isInviteCode } from "../lib/parent-home";
import { parentEndpoints } from "./parent.endpoints";
import { createParentDashboard, mapChildFromLink, mapParentLinkDto } from "../lib/parent.mappers";

export interface ParentDashboardOptions extends RequestOptions {
  selectedChildId?: string | null;
}

function mapConsentDto(item: ConsentDto): Consent {
  return {
    id: String(item.id),
    studentId: String(item.student),
    kind: item.kind,
    granted: Boolean(item.granted),
    updatedAt: item.updated_at,
  };
}

export const parentApi = {
  async getLinks(options?: RequestOptions) {
    const page = normalizePagination<ParentLinkDto>(
      await apiClient.get(authEndpoints.links, { ...options, query: { page_size: 100, ...options?.query } })
    );
    return page.items.map(mapParentLinkDto);
  },

  async getChildren(options?: RequestOptions) {
    const links = await this.getLinks(options);
    const approved = links.filter((item) => item.status === "approved");
    return approved.map((link) => mapChildFromLink(link));
  },

  async getDashboard(options: ParentDashboardOptions = {}) {
    const { selectedChildId, ...requestOptions } = options;
    const links = await this.getLinks(requestOptions);
    if (!links.some((item) => item.status === "approved")) {
      return createParentDashboard(links, []);
    }
    const attendancePage = await attendanceApi.getAll({
      ...requestOptions,
      query: { page_size: 100, ...(selectedChildId ? { student: selectedChildId } : {}) },
    });
    return createParentDashboard(links, attendancePage.items);
  },

  async createChild(dto: CreateChildRequestDto) {
    return apiClient.post(authEndpoints.children, dto);
  },

  async requestLink(loginOrCode: string) {
    const value = loginOrCode.trim();
    return mapParentLinkDto(
      await apiClient.post<ParentLinkDto>(
        authEndpoints.requestLink,
        isInviteCode(value) ? { invite_code: value.toUpperCase() } : { username: value.replace(/^@/, "") }
      )
    );
  },

  async respondLink(id: string, action: LinkAction) {
    return mapParentLinkDto(
      await apiClient.post<ParentLinkDto>(authEndpoints.respondLink(id), { action })
    );
  },

  async getConsents(options?: RequestOptions) {
    const page = normalizePagination<ConsentDto>(
      await apiClient.get(authEndpoints.consents, { ...options, query: { page_size: 100, ...options?.query } })
    );
    return page.items.map(mapConsentDto);
  },

  async setConsent(dto: SetConsentInput) {
    const item = await apiClient.post<ConsentDto>(authEndpoints.consents, {
      student: dto.studentId,
      kind: dto.kind,
      granted: dto.granted,
    });
    return mapConsentDto(item);
  },

  async getHomework(selectedChildId: string, options: RequestOptions = {}): Promise<Assignment[]> {
    return homeworkApi.getChildAssignments(selectedChildId, options);
  },

  cancelLink(id: string) {
    return apiClient.post(authEndpoints.cancelLink(id), {});
  },

  async remindLink(id: string) {
    return mapParentLinkDto(await apiClient.post<ParentLinkDto>(authEndpoints.remindLink(id), {}));
  },

  unlink(id: string) {
    return apiClient.post(authEndpoints.unlink(id), {});
  },

  usernameAvailable(username: string, options?: RequestOptions) {
    return apiClient.get<UsernameAvailability>(authEndpoints.usernameAvailable, { ...options, query: { username } });
  },

  getChildSummary(studentId: string, options?: RequestOptions) {
    return apiClient.get<ChildSummaryDto>(parentEndpoints.childSummary(studentId), options);
  },

  getChildRank(studentId: string, courseId: string, month: string, options?: RequestOptions) {
    return apiClient.get<ChildRankDto>(parentEndpoints.childRank(studentId), { ...options, query: { course: courseId, month } });
  },

  async getChildrenSummary(period: "week" | "month", options?: RequestOptions) {
    return (await apiClient.get<ChildrenSummaryDto[]>(parentEndpoints.childrenSummary, { ...options, query: { period } })) ?? [];
  },

  async getChildSessions(studentId: string, options?: RequestOptions) {
    return (await apiClient.get<ChildSessionDto[]>(authEndpoints.childSessions(studentId), options)) ?? [];
  },

  endChildSession(studentId: string, sessionId: string) {
    return apiClient.delete(authEndpoints.childSession(studentId, sessionId));
  },

  endAllChildSessions(studentId: string) {
    return apiClient.post<{ ended?: number }>(authEndpoints.childSessionsLogoutAll(studentId), {});
  },

  recognizeLogin(loginId: string) {
    return apiClient.post<{ id: string; recognized: boolean }>(authEndpoints.recognizeLogin(loginId), {});
  },
};

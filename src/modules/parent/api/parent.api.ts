import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { attendanceApi } from "@/modules/attendance";
import { courseApi } from "@/modules/course";
import { homeworkApi } from "@/modules/homework";
import { authEndpoints, type CreateChildRequestDto, type LinkAction } from "@/modules/auth";
import type { Assignment } from "@/shared/types";
import type {
  Consent,
  ConsentDto,
  ParentLinkDto,
  SetConsentInput,
} from "./parent.dto";
import { isInviteCode } from "../lib/parent-home";
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
    if (!approved.length) return [];
    const attendancePage = await attendanceApi.getAll({ ...options, query: { page_size: 100 } });
    return approved.map((link) => mapChildFromLink(link, attendancePage.items));
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
    const coursePage = await courseApi.getAll({ ...options, query: { page_size: 100 } });
    const assignments = (
      await Promise.all(
        coursePage.items.map((course) =>
          homeworkApi.getAssignments(course.id, options).catch((): Assignment[] => [])
        )
      )
    ).flat();
    const details = await Promise.all(
      assignments.map((item) => homeworkApi.getAssignment(item.id, options).catch(() => item))
    );
    return details.map((item) => ({
      ...item,
      mySubmission:
        item.submissions?.find((submission) => submission.studentId === selectedChildId) ?? null,
    }));
  },
};

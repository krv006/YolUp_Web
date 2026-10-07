import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { authEndpoints } from "./auth.endpoints";
import { mapLoginRecords, mapTeacherRatings, mapTeacherStats } from "../lib/auth.mappers";
import type {
  AuthUserDto,
  CertificateDto,
  ConsentRequestDto,
  CreateChildRequestDto,
  LinkAction,
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  SwitchAccountResponseDto,
  TokenPairDto,
} from "./auth.dto";

export const authApi = {
  logout(refreshToken: string | null) {
    return apiClient.post(
      authEndpoints.logout,
      refreshToken ? { refresh: refreshToken } : {},
      { skipRefresh: true }
    );
  },
  login(dto: LoginRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.login, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  refresh(dto: RefreshRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.refresh, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  getCurrentUser() {
    return apiClient.get<AuthUserDto>(authEndpoints.me);
  },
  updateCurrentUser(dto: Partial<RegisterRequestDto>) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, dto);
  },
  updateLanguage(language: string) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, { preferred_language: language });
  },
  async getMyRatings(options?: RequestOptions) {
    return mapTeacherRatings(await apiClient.get(authEndpoints.myRatings, options), options?.query);
  },

  async getTeacherRatings(id: string, options?: RequestOptions) {
    return mapTeacherRatings(await apiClient.get(authEndpoints.teacherRatings(id), options), options?.query);
  },

  async getTeacherStats(id: string, options?: RequestOptions) {
    return mapTeacherStats(await apiClient.get(authEndpoints.teacherStats(id), options));
  },

  updateLessonReminderMinutes(minutes: number) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, { lesson_reminder_minutes: minutes });
  },
  updateAvatar(avatar: File | null) {
    const body = new FormData();
    body.set("avatar", avatar ?? "");
    return apiClient.patch<AuthUserDto>(authEndpoints.me, body);
  },
  register(dto: RegisterRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.register, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  switchAccount(id: string) {
    return apiClient.post<SwitchAccountResponseDto>(authEndpoints.switchAccount(id), {});
  },
  switchRole(role: string) {
    return apiClient.post<SwitchAccountResponseDto>(authEndpoints.switchRole, { role });
  },
  createChild(dto: CreateChildRequestDto) {
    return apiClient.post(authEndpoints.children, dto);
  },
  getLinks(options?: RequestOptions) {
    return apiClient.get(authEndpoints.links, options);
  },
  requestLink(value: string) {
    const trimmed = value.trim();
    const body = /^fk-/i.test(trimmed)
      ? { invite_code: trimmed.toUpperCase() }
      : { username: trimmed };
    return apiClient.post(authEndpoints.requestLink, body);
  },
  respondLink(id: string, action: LinkAction) {
    return apiClient.post(authEndpoints.respondLink(id), { action });
  },
  getConsents(options?: RequestOptions) {
    return apiClient.get(authEndpoints.consents, options);
  },
  setConsent(dto: ConsentRequestDto) {
    return apiClient.post(authEndpoints.consents, dto);
  },
  async getLogins(studentId: string | null, options?: RequestOptions) {
    return mapLoginRecords(
      await apiClient.get(authEndpoints.logins, {
        ...options,
        query: studentId ? { student: studentId } : undefined,
      })
    );
  },
  async getTeachers(options?: RequestOptions) {
    const page = normalizePagination<AuthUserDto>(
      await apiClient.get(authEndpoints.teachers, { ...options, query: { page_size: 100, ...options?.query } })
    );
    return page.items;
  },
  async getPendingTeachers(options?: RequestOptions) {
    const page = normalizePagination<AuthUserDto>(
      await apiClient.get(authEndpoints.teachersPending, { ...options, query: { page_size: 100, ...options?.query } })
    );
    return page.items;
  },
  approveTeacher(id: string) {
    return apiClient.post<AuthUserDto>(authEndpoints.teacherApprove(id), {});
  },
  uploadCertificate(file: File, title?: string) {
    const body = new FormData();
    body.set("file", file);
    if (title) body.set("title", title);
    return apiClient.post<CertificateDto>(authEndpoints.meCertificates, body);
  },
  async deleteCertificate(id: string) {
    await apiClient.delete(authEndpoints.meCertificate(id));
    return id;
  },
};

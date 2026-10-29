import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { authEndpoints } from "./auth.endpoints";
import { mapAdminCertificate, mapLoginRecords, mapLoginRecordsPage, mapTeacherRatings, mapTeacherStats } from "../lib/auth.mappers";
import type {
  AdminCertificateDto,
  AuthUserDto,
  CertificateDto,
  ConsentRequestDto,
  CreateChildRequestDto,
  LinkAction,
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RegisterRequestDto,
  SwitchAccountResponseDto,
  TokenPairDto,
  TwoFactorLoginRequestDto,
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
    return apiClient.post<LoginResponseDto>(authEndpoints.login, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  twoFactorLogin(dto: TwoFactorLoginRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.twoFactorLogin, dto, {
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
  changePassword(currentPassword: string, newPassword: string) {
    return apiClient.post<{ password_changed_at?: string | null }>(authEndpoints.passwordChange, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
  updateNotificationPrefs(prefs: { notifyMessages?: boolean; notifyEmail?: boolean }) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, {
      ...(prefs.notifyMessages === undefined ? {} : { notify_messages: prefs.notifyMessages }),
      ...(prefs.notifyEmail === undefined ? {} : { notify_email: prefs.notifyEmail }),
    });
  },
  getTwoFactor(options?: RequestOptions) {
    return apiClient.get<{ enabled?: boolean }>(authEndpoints.twoFactor, options);
  },
  enableTwoFactor(password: string) {
    return apiClient.post<{ sent?: boolean; expires_in?: number; retry_after?: number }>(
      authEndpoints.twoFactorEnable,
      { password }
    );
  },
  confirmTwoFactor(code: string) {
    return apiClient.post<{ enabled?: boolean }>(authEndpoints.twoFactorConfirm, { code });
  },
  disableTwoFactor(password: string) {
    return apiClient.post<{ enabled?: boolean }>(authEndpoints.twoFactorDisable, { password });
  },
  requestPasswordReset(phone: string) {
    return apiClient.post<{ sent?: boolean; expires_in?: number; retry_after?: number }>(
      authEndpoints.passwordResetRequest,
      { phone },
      { skipAuth: true, skipRefresh: true }
    );
  },
  verifyPasswordReset(phone: string, code: string) {
    return apiClient.post<{ reset_token: string; expires_in?: number }>(
      authEndpoints.passwordResetVerify,
      { phone, code },
      { skipAuth: true, skipRefresh: true }
    );
  },
  confirmPasswordReset(resetToken: string, password: string) {
    return apiClient.post<{ ok?: boolean }>(
      authEndpoints.passwordResetConfirm,
      { reset_token: resetToken, password },
      { skipAuth: true, skipRefresh: true }
    );
  },
  getMyStats() {
    return apiClient.get<{ groups?: number; students?: number; experience_years?: number }>(
      authEndpoints.meStats
    );
  },
  async getSessions() {
    const items = await apiClient.get<
      Array<{
        id: string | number;
        device?: string;
        ip?: string;
        city?: string | null;
        last_active?: string;
        is_current?: boolean;
      }>
    >(authEndpoints.sessions);
    return (items ?? []).map((item) => ({
      id: String(item.id),
      device: item.device ?? "",
      ip: item.ip ?? "",
      city: item.city ?? null,
      lastActive: item.last_active ?? "",
      isCurrent: Boolean(item.is_current),
    }));
  },
  revokeSession(id: string) {
    return apiClient.delete(authEndpoints.session(id));
  },
  async logoutOtherSessions() {
    const response = await apiClient.post<{ revoked?: number }>(authEndpoints.logoutOthers, {});
    return response?.revoked ?? 0;
  },
  deleteAccount(password?: string) {
    return apiClient.delete(authEndpoints.me, password ? { body: { password } } : undefined);
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
  removeAvatar() {
    return apiClient.delete<AuthUserDto | null>(authEndpoints.meAvatar);
  },
  updateSettings(dto: { theme?: string; text_size?: string; target_band?: number | null; username?: string }) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, dto);
  },
  async getLoginsPage(page: number, pageSize: number, options?: RequestOptions) {
    return mapLoginRecordsPage(
      await apiClient.get(authEndpoints.logins, { ...options, query: { page, page_size: pageSize } }),
      { page, pageSize }
    );
  },
  async getAdminCertificates(status: string, options?: RequestOptions) {
    return normalizePagination<AdminCertificateDto>(
      await apiClient.get(authEndpoints.adminCertificates, { ...options, query: { status, page_size: 100 } })
    ).items.map(mapAdminCertificate);
  },
  verifyCertificate(id: string) {
    return apiClient.post(authEndpoints.adminCertificateVerify(id), {});
  },
  rejectCertificate(id: string, reason: string) {
    return apiClient.post(authEndpoints.adminCertificateReject(id), { reason });
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
  uploadCertificate(file: File, title?: string, issuer?: string, issuedYear?: number | null) {
    const body = new FormData();
    body.set("file", file);
    if (title) body.set("title", title);
    if (issuer) body.set("issuer", issuer);
    if (issuedYear) body.set("issued_year", String(issuedYear));
    return apiClient.post<CertificateDto>(authEndpoints.meCertificates, body);
  },
  async deleteCertificate(id: string) {
    await apiClient.delete(authEndpoints.meCertificate(id));
    return id;
  },
};

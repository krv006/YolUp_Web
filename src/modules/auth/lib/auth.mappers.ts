import { normalizeMediaUrl, normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import { normalizeRole } from "@/modules/permission";
import type { Role } from "@/shared/constants";
import type {
  AuthUser,
  Certificate,
  LinkedAccount,
  LoginCredentials,
  TeacherRating,
  TeacherStats,
} from "@/shared/types";
import {
  certificateDtoSchema,
  lessonRatingDtoSchema,
  loginRecordDtoSchema,
  loginResponseDtoSchema,
  switchAccountResponseDtoSchema,
  tokenPairDtoSchema,
  userDtoSchema,
  type LinkedAccountDto,
  type LoginRecord,
  type LoginRequestDto,
  type TokenPair,
  type TwoFactorChallenge,
} from "../api/auth.dto";
import { describeUserAgent } from "./describe-user-agent";

export function mapLoginRequest(values: LoginCredentials): LoginRequestDto {
  return { username: values.login.trim(), password: values.password };
}

export function mapTokenPairDto(dto: unknown): TokenPair {
  const parsed = tokenPairDtoSchema.parse(dto);
  return { accessToken: parsed.access, refreshToken: parsed.refresh };
}

export type LoginOutcome =
  | { kind: "tokens"; tokens: TokenPair }
  | { kind: "twoFactor"; challenge: TwoFactorChallenge };

export function mapLoginResponse(dto: unknown): LoginOutcome {
  const parsed = loginResponseDtoSchema.parse(dto);
  if ("two_factor_required" in parsed) {
    return {
      kind: "twoFactor",
      challenge: {
        challengeToken: parsed.challenge_token,
        expiresIn: parsed.expires_in,
        retryAfter: parsed.retry_after,
        phoneHint: parsed.phone_hint,
      },
    };
  }
  return { kind: "tokens", tokens: { accessToken: parsed.access, refreshToken: parsed.refresh } };
}

export function mapCertificateDto(dto: unknown): Certificate {
  const parsed = certificateDtoSchema.parse(dto);
  return {
    id: parsed.id,
    file: parsed.file,
    title: parsed.title || "",
    createdAt: parsed.created_at,
    issuer: parsed.issuer ?? "",
    verified: Boolean(parsed.verified),
  };
}

function mapLinkedAccountDto(dto: LinkedAccountDto): LinkedAccount {
  const name = [dto.first_name, dto.last_name].filter(Boolean).join(" ") || dto.username;
  return {
    id: dto.id,
    username: dto.username,
    name,
    role: normalizeRole(dto.role) as Role,
  };
}

export function mapUserDto(dto: unknown): AuthUser {
  const parsed = userDtoSchema.parse(dto);
  const name = [parsed.first_name, parsed.last_name].filter(Boolean).join(" ") || parsed.username;
  return {
    id: parsed.id,
    username: parsed.username,
    firstName: parsed.first_name,
    lastName: parsed.last_name,
    name,
    role: normalizeRole(parsed.role) as Role,
    phone: parsed.phone ?? null,
    inviteCode: parsed.invite_code ?? null,
    avatarUrl: normalizeMediaUrl(parsed.avatar),
    email: parsed.email ?? null,
    status: "online",
    avgRating: parsed.avg_rating ?? null,
    ratingCount: parsed.rating_count ?? null,
    isApproved: parsed.is_approved ?? null,
    certificates: parsed.certificates.map(mapCertificateDto),
    preferredLanguage: parsed.preferred_language,
    lessonReminderMinutes: parsed.lesson_reminder_minutes ?? null,
    notifyMessages: parsed.notify_messages !== false,
    notifyEmail: parsed.notify_email === true,
    linkedAccounts: parsed.linked_accounts.map(mapLinkedAccountDto),
    middleName: parsed.middle_name ?? null,
    birthDate: parsed.birth_date ?? null,
    subject: parsed.subject ?? null,
    city: parsed.city ?? null,
    bio: parsed.bio ?? null,
    experienceYears: parsed.experience_years ?? null,
    parentPhone: parsed.parent_phone ?? null,
    passwordChangedAt: parsed.password_changed_at ?? null,
  };
}

export function mapSwitchAccountResponse(dto: unknown): { tokens: TokenPair; user: AuthUser } {
  const parsed = switchAccountResponseDtoSchema.parse(dto);
  return {
    tokens: { accessToken: parsed.access, refreshToken: parsed.refresh },
    user: mapUserDto(parsed.user),
  };
}

export function mapLoginRecords(dto: unknown): LoginRecord[] {
  return loginRecordDtoSchema
    .array()
    .parse(Array.isArray(dto) ? dto : ((dto as { results?: unknown[] } | null)?.results ?? []))
    .map((item) => ({
      id: `${item.at}-${item.ip ?? ""}`,
      at: item.at,
      ip: item.ip ?? "—",
      device: describeUserAgent(item.user_agent),
      userAgent: item.user_agent ?? "",
      isNewIp: item.new_ip,
      isNewDevice: item.new_device,
    }));
}

export function mapTeacherRatings(dto: unknown, options?: PaginationOptions): Page<TeacherRating> {
  const page = normalizePagination<unknown>(dto, options);
  return {
    ...page,
    items: page.items.map((item) => {
      const parsed = lessonRatingDtoSchema.parse(item);
      const student = parsed.student ?? {};
      const name = [student.first_name, student.last_name].filter(Boolean).join(" ");
      return {
        id: String(parsed.id),
        lessonId: String(parsed.lesson),
        studentName: name || student.username || "—",
        studentUsername: student.username ?? "",
        stars: Number(parsed.stars ?? 0),
        description: parsed.description ?? "",
        createdAt: parsed.created_at ?? "",
      };
    }),
  };
}

export function mapTeacherStats(dto: unknown): TeacherStats {
  const raw = (dto ?? {}) as Record<string, unknown>;
  const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
  return {
    avgRating: num(raw.avg_rating),
    ratingCount: Number(raw.rating_count ?? 0),
    ratingBreakdown: (raw.rating_breakdown as Record<string, number>) ?? {},
    courseCount: Number(raw.course_count ?? 0),
    studentCount: Number(raw.student_count ?? 0),
    lessonsFinished: Number(raw.lessons_finished ?? 0),
    lessonsCancelled: Number(raw.lessons_cancelled ?? 0),
    lessonsScheduled: Number(raw.lessons_scheduled ?? 0),
    reliability: num(raw.reliability),
  };
}

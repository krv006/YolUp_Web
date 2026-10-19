import { z } from "zod";

export const tokenPairDtoSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

export const certificateDtoSchema = z.object({
  id: z.string(),
  file: z.string(),
  title: z.string().nullable().default(""),
  created_at: z.string(),
});

export const linkedAccountDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  role: z.string(),
});

export const userDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  role: z.string(),
  phone: z.string().nullable().optional(),
  invite_code: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  avg_rating: z.number().nullable().optional(),
  rating_count: z.number().nullable().optional(),
  is_approved: z.boolean().nullable().optional(),
  certificates: z.array(certificateDtoSchema).optional().default([]),
  preferred_language: z.string().default("uz"),
  lesson_reminder_minutes: z.number().nullable().optional(),
  linked_accounts: z.array(linkedAccountDtoSchema).optional().default([]),
  middle_name: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  experience_years: z.number().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
  password_changed_at: z.string().nullable().optional(),
});

export const loginRecordDtoSchema = z.object({
  at: z.string(),
  ip: z.string().nullable().default(null),
  user_agent: z.string().nullable().default(null),
  new_ip: z.boolean().default(false),
  new_device: z.boolean().default(false),
});

export const lessonRatingDtoSchema = z.object({
  id: z.string(),
  lesson: z.string(),
  student: userDtoSchema.partial().extend({ id: z.string().optional() }),
  stars: z.number(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
});

export type LessonRatingDto = z.infer<typeof lessonRatingDtoSchema>;

export const switchAccountResponseDtoSchema = tokenPairDtoSchema.extend({
  user: userDtoSchema,
});

export type TokenPairDto = z.infer<typeof tokenPairDtoSchema>;
export type AuthUserDto = z.infer<typeof userDtoSchema>;
export type LinkedAccountDto = z.infer<typeof linkedAccountDtoSchema>;
export type LoginRecordDto = z.infer<typeof loginRecordDtoSchema>;
export type CertificateDto = z.infer<typeof certificateDtoSchema>;
export type SwitchAccountResponseDto = z.infer<typeof switchAccountResponseDtoSchema>;

export interface LoginRecord {
  id: string;
  at: string;
  ip: string;
  device: string;
  userAgent: string;
  isNewIp: boolean;
  isNewDevice: boolean;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RefreshRequestDto {
  refresh: string;
}

export interface RegisterRequestDto {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
}

export interface CreateChildRequestDto {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  parent_phone?: string;
  course_id?: string;
}

export interface ConsentRequestDto {
  student: string;
  kind: string;
  granted: boolean;
}

export type LinkAction = "approve" | "decline";

export interface RegisterFormValues {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "teacher" | "parent" | "student";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
  username?: string;
  middleName?: string;
  birthDate?: string;
  email?: string;
  subject?: string;
  city?: string;
  bio?: string;
  experienceYears?: number | null;
}

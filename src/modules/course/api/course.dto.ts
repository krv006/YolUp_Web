import type { EnrollmentStatus, UserDto } from "@/shared/types";

export interface CourseDto {
  id: string | number;
  title: string;
  subject?: string;
  subject_label?: string;
  description?: string;
  teacher?: UserDto;
  student_count?: number;
  my_status?: EnrollmentStatus | null;
  is_active?: boolean;
  is_language_subject?: boolean;
  created_at?: string | null;
  lessons_per_week?: number | null;
  monthly_fee?: number | null;
}

export interface EnrollmentDto {
  id: string | number;
  course?: string | number;
  course_title: string;
  student?: UserDto;
  status: EnrollmentStatus;
  created_at: string;
}

export interface SubjectOptionDto {
  value: string;
  label: string;
}

export interface CourseStudentSearchDto extends UserDto {
  enroll_status?: EnrollmentStatus | null;
}

export interface CourseRequestDto {
  title: string;
  subject: string;
  description: string;
  lessons_per_week?: number;
  monthly_fee?: number;
}

export interface CourseFormInput {
  name?: string;
  title?: string;
  subject?: string;
  description?: string;
  lessonsPerWeek?: number | null;
  monthlyFee?: number | null;
}

export interface EnrollPayload {
  student_id?: string;
}

export type EnrollmentAction = "approve" | "decline";

export interface CourseInviteLinkDto {
  code: string | null;
  url: string | null;
  expires_at: string | null;
  require_approval?: boolean;
}

export interface CourseInviteLink {
  code: string;
  url: string;
  expiresAt: string | null;
  requireApproval: boolean;
}

export interface CourseInviteLinkInput {
  requireApproval?: boolean;
  expiresInDays?: number;
}

export interface CourseJoinResultDto {
  course_id: string | number;
  status: "joined" | "pending";
}

export interface CourseStudentPresenceDto {
  id: string | number;
  name?: string;
  username?: string;
  avatar?: string | null;
  is_online?: boolean;
  last_seen?: string | null;
}

export interface CourseStudentPresence {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

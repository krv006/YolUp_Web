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

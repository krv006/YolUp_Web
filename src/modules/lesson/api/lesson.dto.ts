import type { LessonStatus, UserDto } from "@/shared/types";

export interface LessonDto {
  id: string | number;
  course: string | number;
  course_title: string;
  title: string;
  starts_at: string;
  duration_min: number;
  status: LessonStatus;
  room_name: string;
  created_at: string;
  avg_rating?: number | string | null;
  rating_count?: number | null;
  quiz_id?: string | null;
  note?: string | null;
  recurrence_id?: string | number | null;
  students_count?: number | null;
  participants_count?: number | null;
  attendance_rate?: number | null;
  joined_count?: number | null;
  my_rating?: number | null;
  attended?: boolean | null;
  assignment?: { id: string | number; title?: string | null } | null;
  recurrence?: {
    freq?: string | null;
    weeks?: number | null;
    weekdays?: number[] | null;
    ends_on?: string | null;
  } | null;
}

export interface LessonRecurrenceDto {
  freq: "weekly";
  weeks: number;
  weekdays: number[];
}

export interface LessonConflictsDto {
  has_conflict?: boolean | null;
  lessons?: Array<{
    id: string | number;
    title?: string | null;
    course?: string | number | null;
    course_title?: string | null;
    starts_at?: string | null;
    duration_min?: number | null;
  }> | null;
}

export interface LessonWaitingDto {
  waiting_count?: number | null;
  total_count?: number | null;
  students?: Array<{ id: string | number; name?: string | null; avatar?: string | null }> | null;
}

export interface LessonRequestDto {
  course: string | null;
  title: string;
  starts_at: string;
  duration_min: number;
  quiz?: string | null;
  note?: string;
  recurrence?: LessonRecurrenceDto;
}

export type RecordingStatusDto = "recording" | "merging" | "completed" | "failed";

export interface LessonRecordingDto {
  lesson_id?: string;
  title?: string | null;
  status?: RecordingStatusDto | null;
  ready?: boolean | null;
  created_at?: string | null;
  ended_at?: string | null;
  error?: string | null;
  stream_url?: string | null;
  participants_count?: number | null;
  attendance_rate?: number | null;
  board_pages?: number | null;
  chapters?: Array<{ seconds?: number | null; title?: string | null }> | null;
  board_page_previews?: Array<{
    page?: number | null;
    title?: string | null;
    image_url?: string | null;
  }> | null;
  pdf_url?: string | null;
}

export interface LessonRatingDto {
  id: string | number;
  lesson?: string | number;
  student?: UserDto | null;
  student_name?: string | null;
  stars: number;
  description?: string | null;
  created_at: string;
}

export interface LessonRateRequestDto {
  stars: number;
  description?: string;
}

export interface LessonRatingInput {
  stars: number;
  description?: string;
}

export interface LessonScheduleRequestDto {
  title: string;
  days: number[];
  start_time: string;
  end_time: string;
  weeks: number;
  start_date: string;
  note?: string;
}

export interface LessonScheduleResponseDto {
  count?: number;
  lessons?: LessonDto[];
}

export interface LessonFormInput {
  courseId?: string | null;
  topic?: string;
  title?: string;
  startsAt?: string;
  date?: string;
  time?: string;
  duration?: string | number;
  durationMinutes?: string | number;
  quizId?: string | null;
  note?: string;
  recurrence?: LessonRecurrenceDto;
}

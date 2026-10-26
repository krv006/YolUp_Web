export interface TopCourseDto {
  id: string;
  title: string;
  teacher_name: string;
  student_count: number;
  avg_rating: number | null;
  attendance_rate: number | null;
}

export interface TopTeacherDto {
  id: string;
  name: string;
  course_count: number;
  lessons_this_month: number;
  avg_rating: number | null;
  reliability: number | null;
}

export interface DashboardSummaryDto {
  active_students: number;
  active_teachers: number;
  active_courses: number;
  avg_rating: number | null;
  rating_count: number;
  top_courses: TopCourseDto[];
  top_teachers: TopTeacherDto[];
  total_videos?: number | null;
}

export type DashboardPeriodDto = "day" | "week" | "month" | "year";

export interface DashboardTrendsDto {
  period: DashboardPeriodDto;
  labels: string[];
  enrollments: number[];
  lessons_completed: number[];
  lessons_cancelled: number[];
  quiz_avg_score: Array<number | null>;
  attendance_rate: Array<number | null>;
}

export interface MyTrendsDto {
  period: DashboardPeriodDto;
  labels: string[];
  quiz_avg_score: Array<number | null>;
  lessons_completed: number[];
  attendance_rate: Array<number | null>;
}

export interface TeacherDashboardDto {
  lessons_today?: number | null;
  lessons_today_finished?: number | null;
  submissions_pending?: number | null;
  assignments_pending?: number | null;
  students_total?: number | null;
  courses_total?: number | null;
  attendance_rate_week?: number | null;
}

export interface DashboardActivityDto {
  id: string | number;
  category?: string | null;
  title?: string | null;
  body?: string | null;
  link_type?: string | null;
  link_id?: string | number | null;
  is_read?: boolean | null;
  created_at?: string | null;
}

export interface StudentAttemptDto {
  quiz_id: string;
  quiz_title: string;
  course_title: string;
  score: number;
  max_score: number;
  percentage: number | null;
  taken_at: string;
}

export interface StudentAnalyticsDto {
  attempt_count: number;
  avg_percentage: number | null;
  recent_attempts: StudentAttemptDto[];
}

export interface TeacherCourseAnalyticsDto {
  course_id: string;
  course_title: string;
  student_count: number | null;
  avg_rating: number | null;
  reliability: number | null;
  quiz_avg_percentage: number | null;
  quiz_attempt_count: number | null;
  attendance_rate: number | null;
}

export interface TeacherAnalyticsDto {
  overall: Record<string, unknown>;
  courses: TeacherCourseAnalyticsDto[];
}

export interface TeacherVideoStatDto {
  teacher_id: string;
  teacher_name: string;
  video_count: number;
}

export interface TeacherVideoStatsDto {
  total_videos: number;
  teachers: TeacherVideoStatDto[];
}

export interface MonitoringSampleDto {
  id?: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  created_at: string;
}

export interface MonitoringHistoryDto {
  hours: number;
  samples: MonitoringSampleDto[];
  peak: MonitoringSampleDto | null;
}

import type {
  DashboardSummary,
  DashboardTrends,
  MonitoringHistory,
  MonitoringSample,
  MyAnalytics,
  TeacherVideoStats,
  TopCourseStat,
  TopTeacherStat,
} from "@/shared/types";
import type {
  DashboardSummaryDto,
  DashboardTrendsDto,
  MonitoringHistoryDto,
  MonitoringSampleDto,
  StudentAttemptDto,
  TeacherCourseAnalyticsDto,
  TeacherVideoStatsDto,
  TopCourseDto,
  TopTeacherDto,
} from "../api/analytics.dto";

export function mapTopCourseDto(dto: TopCourseDto): TopCourseStat {
  return {
    id: String(dto.id),
    title: dto.title,
    teacherName: dto.teacher_name,
    studentCount: dto.student_count,
    avgRating: dto.avg_rating,
    attendanceRate: dto.attendance_rate,
  };
}

export function mapTopTeacherDto(dto: TopTeacherDto): TopTeacherStat {
  return {
    id: String(dto.id),
    name: dto.name,
    courseCount: dto.course_count,
    lessonsThisMonth: dto.lessons_this_month,
    avgRating: dto.avg_rating,
    reliability: dto.reliability,
  };
}

export function mapDashboardSummaryDto(dto: DashboardSummaryDto): DashboardSummary {
  return {
    totalVideos: Number(dto.total_videos ?? 0),
    activeStudents: dto.active_students,
    activeTeachers: dto.active_teachers,
    activeCourses: dto.active_courses,
    avgRating: dto.avg_rating,
    ratingCount: dto.rating_count,
    topCourses: (dto.top_courses ?? []).map(mapTopCourseDto),
    topTeachers: (dto.top_teachers ?? []).map(mapTopTeacherDto),
  };
}

export function mapDashboardTrendsDto(dto: DashboardTrendsDto): DashboardTrends {
  return {
    period: dto.period,
    labels: dto.labels,
    enrollments: dto.enrollments,
    lessonsCompleted: dto.lessons_completed,
    lessonsCancelled: dto.lessons_cancelled,
    quizAvgScore: dto.quiz_avg_score,
    attendanceRate: dto.attendance_rate,
  };
}

function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function mapMyAnalytics(dto: unknown): MyAnalytics {
  const raw = (dto ?? {}) as Record<string, unknown>;
  if (raw.overall) {
    const overall = raw.overall as Record<string, unknown>;
    return {
      kind: "teacher",
      overall: {
        avgRating: num(overall.avg_rating),
        ratingCount: Number(overall.rating_count ?? 0),
        ratingBreakdown: (overall.rating_breakdown as Record<string, number>) ?? {},
        courseCount: Number(overall.course_count ?? 0),
        studentCount: Number(overall.student_count ?? 0),
        lessonsFinished: Number(overall.lessons_finished ?? 0),
        lessonsCancelled: Number(overall.lessons_cancelled ?? 0),
        lessonsScheduled: Number(overall.lessons_scheduled ?? 0),
        reliability: num(overall.reliability),
      },
      courses: ((raw.courses as TeacherCourseAnalyticsDto[]) ?? []).map((item) => ({
        courseId: String(item.course_id),
        courseTitle: item.course_title ?? "",
        studentCount: num(item.student_count),
        avgRating: num(item.avg_rating),
        reliability: num(item.reliability),
        quizAvgPercentage: num(item.quiz_avg_percentage),
        quizAttemptCount: num(item.quiz_attempt_count),
        attendanceRate: num(item.attendance_rate),
      })),
    };
  }
  return {
    kind: "student",
    attemptCount: Number(raw.attempt_count ?? 0),
    avgPercentage: num(raw.avg_percentage),
    recentAttempts: ((raw.recent_attempts as StudentAttemptDto[]) ?? []).map((item) => ({
      quizId: String(item.quiz_id),
      quizTitle: item.quiz_title ?? "",
      courseTitle: item.course_title ?? "",
      score: Number(item.score ?? 0),
      maxScore: Number(item.max_score ?? 0),
      percentage: num(item.percentage),
      takenAt: item.taken_at ?? "",
    })),
    overview:
      "grades_count" in raw || "lessons_attended" in raw
        ? {
            avgGrade: num(raw.avg_grade),
            gradesCount: Number(raw.grades_count ?? 0),
            attendanceRateMonth: num(raw.attendance_rate_month),
            lessonsAttended: Number(raw.lessons_attended ?? 0),
            lessonsMissed: Number(raw.lessons_missed ?? 0),
            homeworkOnTimeRate: num(raw.homework_on_time_rate),
            courses: ((raw.courses as Array<Record<string, unknown>>) ?? []).map((item) => ({
              courseId: String(item.course_id ?? ""),
              courseTitle: String(item.course_title ?? ""),
              testAvg: num(item.test_avg),
              gradeAvg: num(item.grade_avg),
            })),
          }
        : null,
  };
}

export function mapTeacherVideoStats(dto: unknown): TeacherVideoStats {
  const raw = (dto ?? {}) as TeacherVideoStatsDto;
  return {
    totalVideos: Number(raw.total_videos ?? 0),
    teachers: (raw.teachers ?? []).map((item) => ({
      teacherId: String(item.teacher_id),
      teacherName: item.teacher_name ?? "",
      videoCount: Number(item.video_count ?? 0),
    })),
  };
}

function mapSample(dto: MonitoringSampleDto): MonitoringSample {
  return {
    cpuPercent: Number(dto.cpu_percent ?? 0),
    memoryPercent: Number(dto.memory_percent ?? 0),
    memoryUsedMb: Number(dto.memory_used_mb ?? 0),
    memoryTotalMb: Number(dto.memory_total_mb ?? 0),
    createdAt: dto.created_at ?? "",
  };
}

export function mapMonitoringSample(dto: unknown): MonitoringSample | null {
  if (!dto || typeof dto !== "object") return null;
  return mapSample(dto as MonitoringSampleDto);
}

export function mapMonitoringHistory(dto: unknown): MonitoringHistory {
  const raw = (dto ?? {}) as MonitoringHistoryDto;
  return {
    hours: Number(raw.hours ?? 24),
    samples: (raw.samples ?? []).map(mapSample),
    peak: raw.peak ? mapSample(raw.peak) : null,
  };
}

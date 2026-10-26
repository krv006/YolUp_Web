import { apiClient, type RequestOptions } from "@/shared/api";
import type { DashboardPeriod } from "@/shared/types";
import { analyticsEndpoints } from "./analytics.endpoints";
import type {
  DashboardActivityDto,
  DashboardSummaryDto,
  DashboardTrendsDto,
  MyTrendsDto,
  TeacherDashboardDto,
} from "./analytics.dto";
import {
  mapDashboardSummaryDto,
  mapDashboardTrendsDto,
  mapMonitoringHistory,
  mapMonitoringSample,
  mapMyAnalytics,
  mapTeacherVideoStats,
} from "../lib/analytics.mappers";

export const analyticsApi = {
  async getDashboardSummary(options?: RequestOptions) {
    return mapDashboardSummaryDto(
      await apiClient.get<DashboardSummaryDto>(analyticsEndpoints.summary, options)
    );
  },
  async getDashboardTrends(period: DashboardPeriod, options: RequestOptions = {}) {
    return mapDashboardTrendsDto(
      await apiClient.get<DashboardTrendsDto>(analyticsEndpoints.trends, { ...options, query: { period } })
    );
  },

  async getMyTrends(period: DashboardPeriod, options?: RequestOptions) {
    const dto = await apiClient.get<MyTrendsDto>(analyticsEndpoints.myTrends, {
      ...options,
      query: { period },
    });
    return {
      period: dto.period,
      labels: dto.labels ?? [],
      quizAvgScore: dto.quiz_avg_score ?? [],
      lessonsCompleted: dto.lessons_completed ?? [],
      attendanceRate: dto.attendance_rate ?? [],
    };
  },

  async getTeacherDashboard(options?: RequestOptions) {
    const dto = await apiClient.get<TeacherDashboardDto>(
      analyticsEndpoints.teacherDashboard,
      options
    );
    return {
      lessonsToday: dto.lessons_today ?? 0,
      lessonsTodayFinished: dto.lessons_today_finished ?? 0,
      submissionsPending: dto.submissions_pending ?? 0,
      assignmentsPending: dto.assignments_pending ?? 0,
      studentsTotal: dto.students_total ?? 0,
      coursesTotal: dto.courses_total ?? 0,
      attendanceRateWeek: dto.attendance_rate_week ?? null,
    };
  },

  async getDashboardActivity(limit: number, options?: RequestOptions) {
    const dto = await apiClient.get<DashboardActivityDto[]>(
      analyticsEndpoints.dashboardActivity,
      { ...options, query: { limit } }
    );
    return (Array.isArray(dto) ? dto : []).map((item) => ({
      id: String(item.id),
      category: item.category ?? "",
      title: item.title ?? "",
      body: item.body ?? "",
      linkType: item.link_type ?? null,
      linkId: item.link_id == null ? null : String(item.link_id),
      isRead: Boolean(item.is_read),
      createdAt: item.created_at ?? "",
    }));
  },

  async getMyAnalytics(options?: RequestOptions) {
    return mapMyAnalytics(await apiClient.get(analyticsEndpoints.me, options));
  },

  async getTeacherVideoStats(options?: RequestOptions) {
    return mapTeacherVideoStats(await apiClient.get(analyticsEndpoints.teacherVideoStats, options));
  },

  async getMonitoringCurrent(options?: RequestOptions) {
    return mapMonitoringSample(await apiClient.get(analyticsEndpoints.monitoringCurrent, options));
  },

  async getMonitoringHistory(hours: number, options: RequestOptions = {}) {
    return mapMonitoringHistory(
      await apiClient.get(analyticsEndpoints.monitoringHistory, { ...options, query: { hours } })
    );
  },
};

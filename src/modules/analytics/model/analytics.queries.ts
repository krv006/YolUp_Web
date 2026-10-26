import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DashboardPeriod } from "@/shared/types";
import { analyticsApi } from "../api/analytics.api";

export const analyticsKeys = Object.freeze({
  all: ["analytics"] as const,
  summary: ["analytics", "summary"] as const,
  trends: (period: DashboardPeriod) => ["analytics", "trends", period] as const,
  me: ["analytics", "me"] as const,
  videoStats: ["analytics", "video-stats"] as const,
  monitoringCurrent: ["analytics", "monitoring", "current"] as const,
  monitoringHistory: (hours: number) => ["analytics", "monitoring", "history", hours] as const,
});

export function useDashboardSummary(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.summary,
    queryFn: ({ signal }) => analyticsApi.getDashboardSummary({ signal }),
    enabled,
  });
}

export function useDashboardTrends(period: DashboardPeriod, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.trends(period),
    queryFn: ({ signal }) => analyticsApi.getDashboardTrends(period, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMyTrends(period: DashboardPeriod, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "me", "trends", period],
    queryFn: ({ signal }) => analyticsApi.getMyTrends(period, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useTeacherDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: ({ signal }) => analyticsApi.getTeacherDashboard({ signal }),
    enabled,
    staleTime: 60_000,
  });
}

export function useDashboardActivity(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: ({ signal }) => analyticsApi.getDashboardActivity(limit, { signal }),
    enabled,
    staleTime: 30_000,
  });
}

export function useMyAnalytics(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.me,
    queryFn: ({ signal }) => analyticsApi.getMyAnalytics({ signal }),
    enabled,
  });
}

export function useTeacherVideoStats(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.videoStats,
    queryFn: ({ signal }) => analyticsApi.getTeacherVideoStats({ signal }),
    enabled,
  });
}

const MONITORING_POLL_MS = 60_000;

export function useMonitoringCurrent(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.monitoringCurrent,
    queryFn: ({ signal }) => analyticsApi.getMonitoringCurrent({ signal }),
    enabled,
    refetchInterval: MONITORING_POLL_MS,
  });
}

export function useMonitoringHistory(hours: number, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.monitoringHistory(hours),
    queryFn: ({ signal }) => analyticsApi.getMonitoringHistory(hours, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: MONITORING_POLL_MS,
  });
}

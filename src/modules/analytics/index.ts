export { analyticsApi } from "./api/analytics.api";
export { analyticsEndpoints } from "./api/analytics.endpoints";
export type {
  DashboardPeriodDto,
  DashboardSummaryDto,
  DashboardTrendsDto,
  TopCourseDto,
  TopTeacherDto,
} from "./api/analytics.dto";
export {
  mapDashboardSummaryDto,
  mapDashboardTrendsDto,
  mapTopCourseDto,
  mapTopTeacherDto,
} from "./lib/analytics.mappers";
export {
  analyticsKeys,
  useDashboardSummary,
  useDashboardTrends,
  useMonitoringCurrent,
  useMonitoringHistory,
  useMyAnalytics,
  useMyTrends,
  useTeacherDashboard,
  useDashboardActivity,
  useTeacherVideoStats,
} from "./model/analytics.queries";
export { TrendLineChart, type TrendLineSeries } from "./ui/trend-line-chart";
export { TrendStackedBarChart, type TrendBarSeries } from "./ui/trend-stacked-bar-chart";

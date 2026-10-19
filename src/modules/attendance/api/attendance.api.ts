import { apiClient, type RequestOptions } from "@/shared/api";
import { attendanceEndpoints } from "./attendance.endpoints";
import type { AttendanceDto } from "./attendance.dto";
import { mapAttendanceDto, mapAttendancePage } from "../lib/attendance.mappers";

export const attendanceApi = {
  async getAll(options: RequestOptions = {}) {
    return mapAttendancePage(await apiClient.get(attendanceEndpoints.list, options), options.query);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapAttendanceDto(await apiClient.get<AttendanceDto>(attendanceEndpoints.detail(id), options));
  },
  async getSummary(
    courseId: string,
    range: "all" | "30d" | "month" = "all",
    options: RequestOptions = {}
  ) {
    const dto = await apiClient.get<{
      attendance_percent?: number;
      focus_percent?: number;
      lesson_count?: number;
      students?: Array<{
        id: string | number;
        name?: string;
        attendance_percent?: number;
        focus_percent?: number | null;
        attended_count?: number;
      }>;
    }>(attendanceEndpoints.summary(courseId), { ...options, query: { range } });
    return {
      attendancePercent: dto?.attendance_percent ?? 0,
      focusPercent: dto?.focus_percent ?? 0,
      lessonCount: dto?.lesson_count ?? 0,
      students: (dto?.students ?? []).map((item) => ({
        id: String(item.id),
        name: item.name ?? "",
        attendancePercent: item.attendance_percent ?? 0,
        focusPercent: item.focus_percent ?? null,
        attendedCount: item.attended_count ?? 0,
      })),
    };
  },
};

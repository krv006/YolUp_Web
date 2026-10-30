import { apiClient, type RequestOptions } from "@/shared/api";
import { attendanceEndpoints } from "./attendance.endpoints";
import type { AttendanceDto, AttendanceSummaryDto } from "./attendance.dto";
import { mapAttendanceDto, mapAttendancePage, mapAttendanceSummary } from "../lib/attendance.mappers";

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
    return mapAttendanceSummary(
      await apiClient.get<AttendanceSummaryDto>(attendanceEndpoints.summary(courseId), { ...options, query: { range } })
    );
  },
};

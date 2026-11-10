import { apiClient, type RequestOptions } from "@/shared/api";
import { attendanceEndpoints } from "./attendance.endpoints";
import type { AttendanceDto, AttendanceSummaryDto } from "./attendance.dto";
import { mapAttendanceDto, mapAttendancePage, mapAttendanceSummary } from "../lib/attendance.mappers";

const COURSE_PAGE_SIZE = 100;
const COURSE_PAGE_LIMIT = 30;

export const attendanceApi = {
  async getAll(options: RequestOptions = {}) {
    return mapAttendancePage(await apiClient.get(attendanceEndpoints.list, options), options.query);
  },
  async getAllForCourse(courseId: string, from: string | null, options: RequestOptions = {}) {
    const query = { course: courseId, page_size: COURSE_PAGE_SIZE, ...(from ? { from } : {}) };
    const first = await attendanceApi.getAll({ ...options, query: { ...query, page: 1 } });
    const pages = Math.min(COURSE_PAGE_LIMIT, Math.ceil(first.total / COURSE_PAGE_SIZE));
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
        attendanceApi.getAll({ ...options, query: { ...query, page: index + 2 } })
      )
    );
    return [first, ...rest].flatMap((page) => page.items);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapAttendanceDto(await apiClient.get<AttendanceDto>(attendanceEndpoints.detail(id), options));
  },
  async updateNote(id: string, patch: { teacherNote?: string; lateReason?: string }) {
    return mapAttendanceDto(
      await apiClient.patch<AttendanceDto>(attendanceEndpoints.detail(id), {
        ...(patch.teacherNote === undefined ? {} : { teacher_note: patch.teacherNote }),
        ...(patch.lateReason === undefined ? {} : { late_reason: patch.lateReason }),
      })
    );
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

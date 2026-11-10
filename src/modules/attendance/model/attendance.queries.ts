import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryParams } from "@/shared/api";
import { attendanceApi } from "../api/attendance.api";

export const attendanceKeys = Object.freeze({
  all: ["attendance"] as const,
  list: (params: QueryParams = {}) => ["attendance", "list", params] as const,
  detail: (id: string) => ["attendance", "detail", id] as const,
});

export function useAttendance(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: ({ signal }) => attendanceApi.getAll({ signal, query: params }),
    select: (page) => page.items,
    enabled,
  });
}

export function useAttendanceSummary(
  courseId: string | null,
  range: "all" | "30d" | "month" = "all",
  enabled = true
) {
  return useQuery({
    queryKey: ["attendance", "summary", courseId, range],
    queryFn: ({ signal }) =>
      attendanceApi.getSummary(courseId as string, range, { signal }),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useCourseAttendance(courseId: string | null, from: string | null, enabled = true) {
  return useQuery({
    queryKey: ["attendance", "course", courseId, from],
    queryFn: ({ signal }) => attendanceApi.getAllForCourse(courseId as string, from, { signal }),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useAttendancePage(params: QueryParams = {}) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: ({ signal }) => attendanceApi.getAll({ signal, query: params }),
  });
}

export function useUpdateAttendanceNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacherNote, lateReason }: { id: string; teacherNote?: string; lateReason?: string }) =>
      attendanceApi.updateNote(id, { teacherNote, lateReason }),
    onSuccess: () => client.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress.api";

export const progressKeys = Object.freeze({
  all: ["progress"] as const,
  course: (courseId: string, month: string | undefined) => ["progress", "course", courseId, month ?? "current"] as const,
  student: (courseId: string, studentId: string) => ["progress", "student", courseId, studentId] as const,
});

export function useCourseProgress(courseId: string | null, month: string | undefined, enabled = true) {
  return useQuery({
    queryKey: progressKeys.course(courseId ?? "", month),
    queryFn: ({ signal }) => progressApi.getCourse(courseId as string, month, { signal }),
    enabled: Boolean(courseId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useStudentProgress(courseId: string | null, studentId: string | null) {
  return useQuery({
    queryKey: progressKeys.student(courseId ?? "", studentId ?? ""),
    queryFn: ({ signal }) => progressApi.getStudent(courseId as string, studentId as string, { signal }),
    enabled: Boolean(courseId) && Boolean(studentId),
  });
}

export interface PaymentVars {
  courseId: string;
  studentId: string;
  month: string;
}

export function useMarkPaid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId, month }: PaymentVars) => progressApi.markPaid(courseId, studentId, month),
    onSuccess: () => client.invalidateQueries({ queryKey: progressKeys.all }),
  });
}

export function useUnmarkPaid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId, month }: PaymentVars) => progressApi.unmarkPaid(courseId, studentId, month),
    onSuccess: () => client.invalidateQueries({ queryKey: progressKeys.all }),
  });
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress.api";
import type { ProgressRange } from "../api/progress.dto";

export const progressKeys = Object.freeze({
  all: ["progress"] as const,
  course: (courseId: string, month: string | undefined, range: ProgressRange) =>
    ["progress", "course", courseId, month ?? "current", range] as const,
  student: (courseId: string, studentId: string, range: ProgressRange) =>
    ["progress", "student", courseId, studentId, range] as const,
});

export function useCourseProgress(courseId: string | null, month: string | undefined, range: ProgressRange = "all", enabled = true) {
  return useQuery({
    queryKey: progressKeys.course(courseId ?? "", month, range),
    queryFn: ({ signal }) => progressApi.getCourse(courseId as string, month, range, { signal }),
    enabled: Boolean(courseId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useStudentProgress(courseId: string | null, studentId: string | null, range: ProgressRange = "all") {
  return useQuery({
    queryKey: progressKeys.student(courseId ?? "", studentId ?? "", range),
    queryFn: ({ signal }) => progressApi.getStudent(courseId as string, studentId as string, range, { signal }),
    enabled: Boolean(courseId) && Boolean(studentId),
  });
}

export interface PaymentVars {
  courseId: string;
  studentId: string;
  month: string;
}

export interface MarkPaidVars extends PaymentVars {
  amount?: number;
  note?: string;
}

export function useMarkPaid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId, month, amount, note }: MarkPaidVars) =>
      progressApi.markPaid(courseId, studentId, month, {
        ...(amount === undefined ? {} : { amount }),
        ...(note === undefined ? {} : { note }),
      }),
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

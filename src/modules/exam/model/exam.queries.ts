import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { QuizAttemptAnswerInput } from "@/modules/quiz";
import { examApi } from "../api/exam.api";
import type { ExamFormValues, ExamTemplateFormValues } from "../api/exam.dto";

export const examKeys = Object.freeze({
  all: ["exams"] as const,
  templates: ["exams", "templates"] as const,
  list: (courseId: string | null) => ["exams", "list", courseId ?? "all"] as const,
  detail: (id: string) => ["exams", "detail", id] as const,
  current: (id: string) => ["exams", "current", id] as const,
  results: (id: string) => ["exams", "detail", id, "results"] as const,
  studentResult: (id: string, studentId: string) =>
    ["exams", "detail", id, "result", studentId] as const,
});

export function useExamTemplates(enabled = true) {
  return useQuery({
    queryKey: examKeys.templates,
    queryFn: ({ signal }) => examApi.getTemplates({ signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useExams(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: examKeys.list(courseId),
    queryFn: ({ signal }) => examApi.getAll(courseId, { signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useExam(id: string | null) {
  return useQuery({
    queryKey: examKeys.detail(id ?? ""),
    queryFn: ({ signal }) => examApi.getOne(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useExamCurrent(id: string | null, refetchInterval: number | false = 15_000) {
  return useQuery({
    queryKey: examKeys.current(id ?? ""),
    queryFn: ({ signal }) => examApi.getCurrent(id as string, { signal }),
    enabled: Boolean(id),
    refetchInterval,
    retry: false,
  });
}

export function useExamResults(examId: string | null, enabled = true) {
  return useQuery({
    queryKey: examKeys.results(examId ?? ""),
    queryFn: ({ signal }) => examApi.getResults(examId as string, { signal }),
    enabled: Boolean(examId) && enabled,
  });
}

export function useExamStudentResult(examId: string | null, studentId: string | null) {
  return useQuery({
    queryKey: examKeys.studentResult(examId ?? "", studentId ?? ""),
    queryFn: ({ signal }) => examApi.getStudentResult(examId as string, studentId as string, { signal }),
    enabled: Boolean(examId && studentId),
    refetchInterval: (query) =>
      query.state.data?.ai?.status === "running" ? 10_000 : false,
  });
}

export function useStartAiReview(examId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => examApi.startAiReview(examId, studentId),
    onSuccess: (_result, studentId) =>
      client.invalidateQueries({ queryKey: examKeys.studentResult(examId, studentId) }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useApproveAiBand(examId: string) {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, band }: { studentId: string; band?: number }) =>
      examApi.approveAiBand(examId, studentId, band),
    onSuccess: (result) => {
      client.setQueryData(examKeys.studentResult(examId, result.studentId), result);
      client.invalidateQueries({ queryKey: examKeys.results(examId) });
      toast.success(t("toast.aiApproved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateExam() {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: ExamFormValues) => examApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.all });
      toast.success(t("toast.created"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateExam() {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { title?: string; startsAt?: string } }) =>
      examApi.update(id, values),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.all });
      toast.success(t("toast.updated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteExam() {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.all });
      toast.success(t("toast.deleted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateExamTemplate() {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: ExamTemplateFormValues) => examApi.createTemplate(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.templates });
      toast.success(t("toast.templateCreated"));
    },
  });
}

export function useDeleteExamTemplate() {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examApi.removeTemplate(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.templates });
      toast.success(t("toast.templateDeleted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSaveManualScores(examId: string) {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, scores }: { studentId: string; scores: Record<string, number> }) =>
      examApi.saveManualScores(examId, studentId, scores),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.results(examId) });
      toast.success(t("toast.scoresSaved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSaveExamAnswers(examId: string) {
  return useMutation({
    mutationFn: (answers: QuizAttemptAnswerInput[]) => examApi.saveAnswers(examId, answers),
  });
}

export function useFinishExam(examId: string) {
  const { t } = useTranslation("exam");
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => examApi.finish(examId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: examKeys.all });
      toast.success(t("toast.finished"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

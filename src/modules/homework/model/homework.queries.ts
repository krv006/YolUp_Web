import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StrokeDto } from "@/modules/board";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { downloadBlob } from "@/shared/lib";
import type { Submission } from "@/shared/types";
import { homeworkApi } from "../api/homework.api";
import type {
  AssignmentFormInput,
  ResubmitRequestInput,
  SubmissionReviewInput,
} from "../api/homework.dto";

const POLL_INTERVAL_MS = 2500;
const DEFAULT_MAX_POLLING_MS = 5 * 60_000;

export const homeworkKeys = Object.freeze({
  all: ["homework"] as const,
  assignments: (courseId: string | null) => ["homework", "assignments", courseId] as const,
  assignment: (id: string) => ["homework", "assignment", id] as const,
  submission: (id: string) => ["homework", "submission", id] as const,
  board: (id: string) => ["homework", "board", id] as const,
  report: (studentId?: string | null) => ["homework", "report", studentId ?? "me"] as const,
});

export function getHomeworkPollingInterval(
  submission: Submission | undefined,
  elapsedMs: number,
  maxPollingMs: number
): number | false {
  return submission?.status === "checking" && elapsedMs < maxPollingMs ? POLL_INTERVAL_MS : false;
}

export function useAssignments(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: homeworkKeys.assignments(courseId),
    queryFn: ({ signal }) => homeworkApi.getAssignments(courseId, { signal }),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useAssignment(id: string | null | undefined) {
  return useQuery({
    queryKey: homeworkKeys.assignment(id ?? ""),
    queryFn: ({ signal }) => homeworkApi.getAssignment(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export interface UseSubmissionOptions {
  poll?: boolean;
  maxPollingMs?: number;
}

export function useSubmission(
  id: string | null | undefined,
  { poll = true, maxPollingMs = DEFAULT_MAX_POLLING_MS }: UseSubmissionOptions = {}
) {
  const [startedAt] = useState(Date.now);
  return useQuery({
    queryKey: homeworkKeys.submission(id ?? ""),
    queryFn: ({ signal }) => homeworkApi.getSubmission(id as string, { signal }),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      poll
        ? getHomeworkPollingInterval(
            query.state.data ?? undefined,
            Date.now() - startedAt,
            maxPollingMs
          )
        : false,
    refetchOnWindowFocus: true,
  });
}

export function useHomeworkReport(studentId?: string | null, enabled = true) {
  return useQuery({
    queryKey: homeworkKeys.report(studentId),
    queryFn: ({ signal }) => homeworkApi.getReport(studentId, { signal }),
    enabled,
  });
}

export function useCreateAssignment() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: AssignmentFormInput) => homeworkApi.createAssignment(form),
    onSuccess: (item) => {
      client.invalidateQueries({ queryKey: homeworkKeys.assignments(item.courseId) });
      toast.success(t("toast.assignmentCreated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateAssignment() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: AssignmentFormInput }) =>
      homeworkApi.updateAssignment(id, form),
    onSuccess: (item) => {
      client.invalidateQueries({ queryKey: homeworkKeys.assignments(item.courseId) });
      toast.success(t("toast.assignmentUpdated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRequestResubmit() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: ResubmitRequestInput) => homeworkApi.requestResubmit(id, comment),
    onSuccess: (id) => {
      client.invalidateQueries({ queryKey: homeworkKeys.submission(id) });
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.resubmitRequested"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemindAssignment() {
  const { t } = useTranslation("homework");
  return useMutation({
    mutationFn: ({
      assignmentId,
      message,
      notifyParents,
    }: {
      assignmentId: string;
      message?: string;
      notifyParents?: boolean;
    }) => homeworkApi.remind(assignmentId, { message, notifyParents }),
    onSuccess: (result) =>
      toast.success(t("toast.reminderSent", { count: result.notified ?? 0 })),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useHomeworkAiStats(period: "today" | "week" | "month" = "today", enabled = true) {
  return useQuery({
    queryKey: ["homework", "ai-stats", period],
    queryFn: ({ signal }) => homeworkApi.getAiStats(period, { signal }),
    enabled,
    staleTime: 60_000,
  });
}

export function useAssignmentAiSummary() {
  return useMutation({
    mutationFn: (assignmentId: string) => homeworkApi.getAiSummary(assignmentId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitHomework() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      file,
      skillKey,
      comment,
    }: {
      assignmentId: string;
      file: File | null;
      skillKey?: string;
      comment?: string;
    }) => homeworkApi.submit(assignmentId, file, skillKey, comment),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.submitted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useHomeworkBoard(assignmentId: string | null) {
  return useQuery({
    queryKey: homeworkKeys.board(assignmentId ?? ""),
    queryFn: ({ signal }) => homeworkApi.getBoard(assignmentId as string, { signal }),
    enabled: Boolean(assignmentId),
    staleTime: Infinity, // doska holati sahifada o'zgartiriladi — qayta yuklash chizilganni bosib ketmasin
    refetchOnWindowFocus: false,
  });
}

export function useSaveHomeworkBoard(assignmentId: string) {
  return useMutation({ mutationFn: (sheets: StrokeDto[][]) => homeworkApi.saveBoard(assignmentId, sheets) });
}

export function useSubmitHomeworkBoard() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => homeworkApi.submitBoard(assignmentId),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.submitted"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteAssignment() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkApi.deleteAssignment(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.assignmentDeleted"));
    },
  });
}

export function useRecheckSubmission() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkApi.recheck(id),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.rechecking"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReviewSubmission() {
  const { t } = useTranslation("homework");
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmissionReviewInput }) =>
      homeworkApi.review(id, input),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success(t("toast.gradeUpdated"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDownloadAssignmentFile() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName?: string }) =>
      downloadBlob(await homeworkApi.downloadAssignment(id), fileName),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDownloadSubmissionFile() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName?: string }) =>
      downloadBlob(await homeworkApi.downloadSubmission(id), fileName),
    onError: (error: Error) => toast.error(error.message),
  });
}

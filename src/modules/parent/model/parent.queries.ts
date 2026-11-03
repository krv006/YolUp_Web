import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateChildRequestDto, LinkAction } from "@/modules/auth";
import { parentApi } from "../api/parent.api";
import type { SetConsentInput } from "../api/parent.dto";
import { examApi } from "@/modules/exam";
import { homeworkApi } from "@/modules/homework";
import { AppError } from "@/shared/api";
import { isConsentRequired } from "../lib/parent-errors";

export const parentKeys = Object.freeze({
  all: ["parent"] as const,
  dashboard: (childId?: string | null) => ["parent", "dashboard", childId ?? "all"] as const,
  children: ["parent", "children"] as const,
  links: ["parent", "links"] as const,
  consents: ["parent", "consents"] as const,
  homework: (childId: string | null) => ["parent", "homework", childId] as const,
  summary: (childId: string | null) => ["parent", "summary", childId] as const,
  childrenSummary: (period: string) => ["parent", "children-summary", period] as const,
  rank: (childId: string | null, courseId: string | null, month: string) => ["parent", "rank", childId, courseId, month] as const,
  sessions: (childId: string | null) => ["parent", "sessions", childId] as const,
  exams: (childId: string | null) => ["parent", "exams", childId] as const,
  username: (value: string) => ["parent", "username", value] as const,
});

const noConsentRetry = (count: number, error: Error) => !isConsentRequired(error) && !(error instanceof AppError && error.status === 403) && count < 2;

export function useParentDashboard(selectedChildId?: string | null) {
  return useQuery({
    queryKey: parentKeys.dashboard(selectedChildId),
    queryFn: ({ signal }) => parentApi.getDashboard({ signal, selectedChildId }),
  });
}

export function useParentChildren() {
  return useQuery({
    queryKey: parentKeys.children,
    queryFn: ({ signal }) => parentApi.getChildren({ signal }),
  });
}

export function useParentLinks(enabled = true) {
  return useQuery({
    queryKey: parentKeys.links,
    queryFn: ({ signal }) => parentApi.getLinks({ signal }),
    enabled,
  });
}

export function useParentConsents() {
  return useQuery({
    queryKey: parentKeys.consents,
    queryFn: ({ signal }) => parentApi.getConsents({ signal }),
  });
}

export function useParentHomework(selectedChildId: string | null) {
  return useQuery({
    queryKey: parentKeys.homework(selectedChildId),
    queryFn: ({ signal }) => parentApi.getHomework(selectedChildId as string, { signal }),
    enabled: Boolean(selectedChildId),
  });
}

export function useRequestChildLink({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => parentApi.requestLink(inviteCode),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      if (notify) toast.success("Bog‘lash so‘rovi yuborildi");
    },
  });
}

export function useCreateChild({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChildRequestDto) => parentApi.createChild(dto),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      if (notify) toast.success("Bola hisobi yaratildi");
    },
  });
}

export function useRespondParentLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: LinkAction }) =>
      parentApi.respondLink(id, action),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.all });
      toast.success("So‘rov yangilandi");
    },
  });
}

export function useSetParentConsent({ notify = true }: { notify?: boolean } = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetConsentInput) => parentApi.setConsent(dto),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: parentKeys.consents });
      if (notify) toast.success("Maxfiylik ruxsati saqlandi");
    },
  });
}

export function useChildSummary(childId: string | null) {
  return useQuery({
    queryKey: parentKeys.summary(childId),
    queryFn: ({ signal }) => parentApi.getChildSummary(childId as string, { signal }),
    enabled: Boolean(childId),
    retry: noConsentRetry,
  });
}

export function useChildrenSummary(period: "week" | "month", enabled = true) {
  return useQuery({
    queryKey: parentKeys.childrenSummary(period),
    queryFn: ({ signal }) => parentApi.getChildrenSummary(period, { signal }),
    enabled,
  });
}

export function useChildRank(childId: string | null, courseId: string | null, month: string) {
  return useQuery({
    queryKey: parentKeys.rank(childId, courseId, month),
    queryFn: ({ signal }) => parentApi.getChildRank(childId as string, courseId as string, month, { signal }),
    enabled: Boolean(childId && courseId),
    retry: false,
  });
}

export function useChildExams(childId: string | null) {
  return useQuery({
    queryKey: parentKeys.exams(childId),
    queryFn: ({ signal }) => examApi.getAll(null, { signal, query: { student: childId as string } }),
    enabled: Boolean(childId),
    refetchInterval: 60_000,
  });
}

export function useChildSessions(childId: string | null, enabled = true) {
  return useQuery({
    queryKey: parentKeys.sessions(childId),
    queryFn: ({ signal }) => parentApi.getChildSessions(childId as string, { signal }),
    enabled: Boolean(childId) && enabled,
  });
}

export function useUsernameAvailability(username: string) {
  const value = username.trim();
  return useQuery({
    queryKey: parentKeys.username(value.toLowerCase()),
    queryFn: ({ signal }) => parentApi.usernameAvailable(value, { signal }),
    enabled: value.length >= 3,
    staleTime: 30_000,
    retry: false,
  });
}

function useParentMutation<T, R>(mutationFn: (input: T) => Promise<R>, keys: ReadonlyArray<readonly unknown[]> = [parentKeys.all]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of keys) void client.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCancelLink() {
  return useParentMutation((linkId: string) => parentApi.cancelLink(linkId));
}

export function useRemindLink() {
  return useParentMutation((linkId: string) => parentApi.remindLink(linkId));
}

export function useUnlinkChild() {
  return useParentMutation((linkId: string) => parentApi.unlink(linkId));
}

export function useEndChildSession(childId: string) {
  return useParentMutation((sessionId: string) => parentApi.endChildSession(childId, sessionId), [parentKeys.sessions(childId), ["auth"]]);
}

export function useEndAllChildSessions(childId: string) {
  return useParentMutation(() => parentApi.endAllChildSessions(childId), [parentKeys.sessions(childId), ["auth"]]);
}

export function useRecognizeLogin() {
  return useParentMutation((loginId: string) => parentApi.recognizeLogin(loginId), [["auth"]]);
}

export function useRemindChildHomework(childId: string) {
  return useParentMutation((assignmentId: string) => homeworkApi.remindChild(assignmentId, childId), [parentKeys.homework(childId)]);
}

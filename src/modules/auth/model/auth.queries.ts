import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { mapUserDto } from "../lib/auth.mappers";

export const authKeys = Object.freeze({
  all: ["auth"] as const,
  logins: (studentId: string | null) => ["auth", "logins", studentId] as const,
  teachers: ["auth", "teachers"] as const,
  teachersPending: ["auth", "teachers", "pending"] as const,
  myRatings: ["auth", "ratings", "me"] as const,
  teacherRatings: (id: string) => ["auth", "ratings", id] as const,
  teacherStats: (id: string) => ["auth", "stats", id] as const,
  twoFactor: ["auth", "2fa"] as const,
  loginsPage: (page: number) => ["auth", "logins", "page", page] as const,
  adminCertificates: (status: string) => ["auth", "admin", "certificates", status] as const,
});

export function useLoginHistoryPage(page: number, pageSize = 10) {
  return useQuery({
    queryKey: authKeys.loginsPage(page),
    queryFn: ({ signal }) => authApi.getLoginsPage(page, pageSize, { signal }),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useAdminCertificates(status: string) {
  return useQuery({
    queryKey: authKeys.adminCertificates(status),
    queryFn: ({ signal }) => authApi.getAdminCertificates(status, { signal }),
  });
}

export function useVerifyCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.verifyCertificate(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth", "admin", "certificates"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRejectCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => authApi.rejectCertificate(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth", "admin", "certificates"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useTwoFactorStatus(enabled = true) {
  return useQuery({
    queryKey: authKeys.twoFactor,
    queryFn: ({ signal }) => authApi.getTwoFactor({ signal }),
    enabled,
    staleTime: 30_000,
  });
}

export function useLoginHistory(studentId: string | null = null, enabled = true) {
  return useQuery({
    queryKey: authKeys.logins(studentId),
    queryFn: ({ signal }) => authApi.getLogins(studentId, { signal }),
    enabled,
    staleTime: 30_000,
  });
}

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => authApi.getSessions(),
    enabled,
  });
}

export function useMyStats(enabled = true) {
  return useQuery({
    queryKey: ["auth", "me", "stats"],
    queryFn: () => authApi.getMyStats(),
    enabled,
  });
}

export function useMyRatings(enabled = true) {
  return useQuery({
    queryKey: authKeys.myRatings,
    queryFn: ({ signal }) => authApi.getMyRatings({ signal, query: { page_size: 50 } }),
    enabled,
  });
}

export function useTeacherRatings(id: string | null, enabled = true) {
  return useQuery({
    queryKey: authKeys.teacherRatings(id ?? ""),
    queryFn: ({ signal }) => authApi.getTeacherRatings(id as string, { signal, query: { page_size: 50 } }),
    enabled: Boolean(id) && enabled,
  });
}

export function useTeacherStats(id: string | null, enabled = true) {
  return useQuery({
    queryKey: authKeys.teacherStats(id ?? ""),
    queryFn: ({ signal }) => authApi.getTeacherStats(id as string, { signal }),
    enabled: Boolean(id) && enabled,
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: authKeys.teachers,
    queryFn: async ({ signal }) => (await authApi.getTeachers({ signal })).map(mapUserDto),
  });
}

export function usePendingTeachers() {
  return useQuery({
    queryKey: authKeys.teachersPending,
    queryFn: async ({ signal }) => (await authApi.getPendingTeachers({ signal })).map(mapUserDto),
  });
}

export function useApproveTeacher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.approveTeacher(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: authKeys.teachers });
      client.invalidateQueries({ queryKey: authKeys.teachersPending });
      toast.success("O‘qituvchi tasdiqlandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

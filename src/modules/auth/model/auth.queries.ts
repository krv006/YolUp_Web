import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AuthUser } from "@/shared/types";
import { authApi } from "../api/auth.api";
import { mapUserDto } from "../lib/auth.mappers";
import type { LoginDeviceType, RegisterOptions } from "../api/auth.dto";

export const authKeys = Object.freeze({
  all: ["auth"] as const,
  logins: (studentId: string | null) => ["auth", "logins", studentId] as const,
  teachers: ["auth", "teachers"] as const,
  teachersPending: ["auth", "teachers", "pending"] as const,
  myRatings: ["auth", "ratings", "me"] as const,
  teacherRatings: (id: string) => ["auth", "ratings", id] as const,
  teacherStats: (id: string) => ["auth", "stats", id] as const,
  twoFactor: ["auth", "2fa"] as const,
  loginDevices: (page: number, device: LoginDeviceType | null) => ["auth", "logins", "devices", page, device] as const,
});

export function useLoginDevicesPage(page: number, pageSize = 10, device: LoginDeviceType | null = null) {
  return useQuery({
    queryKey: authKeys.loginDevices(page, device),
    queryFn: ({ signal }) => authApi.getLoginDevicesPage(page, pageSize, device, { signal }),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
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

export function useSetTeacherTestAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => authApi.setTestAccess(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await client.cancelQueries({ queryKey: authKeys.teachers, exact: true });
      const previous = client.getQueryData<AuthUser[]>(authKeys.teachers);
      client.setQueryData<AuthUser[]>(authKeys.teachers, (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, canCreateTests: enabled } : row))
      );
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) client.setQueryData(authKeys.teachers, context.previous);
      toast.error(error.message);
    },
    onSettled: () => client.invalidateQueries({ queryKey: authKeys.teachers, exact: true }),
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

const NO_EMAIL: RegisterOptions = { emailRequired: false, emailAvailable: false };

export function useRegisterOptions() {
  return useQuery({
    queryKey: ["auth", "register-options"] as const,
    queryFn: async ({ signal }): Promise<RegisterOptions> => {
      const dto = await authApi.getRegisterOptions({ signal });
      const emailAvailable = dto?.email_available === true;
      return { emailAvailable, emailRequired: emailAvailable && dto?.email_required === true };
    },
    staleTime: 5 * 60_000,
    retry: false,
    placeholderData: NO_EMAIL,
  });
}

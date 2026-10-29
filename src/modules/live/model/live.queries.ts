import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppError } from "@/shared/api";
import { liveApi } from "../api/live.api";

export const liveKeys = Object.freeze({
  all: ["live"] as const,
  token: (id: string) => ["live", "token", id] as const,
  attention: (id: string) => ["live", "attention", id] as const,
  presence: (id: string) => ["live", "presence", id] as const,
});

export function useLessonPresence(lessonId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: liveKeys.presence(lessonId ?? ""),
    queryFn: ({ signal }) => liveApi.getPresence(lessonId as string, { signal }),
    enabled: Boolean(lessonId) && enabled,
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}

export function useMuteAll(lessonId: string) {
  return useMutation({
    mutationFn: (except: string[] = []) => liveApi.muteAll(lessonId, except),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Amal bajarilmadi"),
  });
}

export function useLiveToken(lessonId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: liveKeys.token(lessonId ?? ""),
    queryFn: () => liveApi.getToken(lessonId as string),
    enabled: Boolean(lessonId && enabled),
    staleTime: 90 * 60_000,
    retry: false,
  });
}

// Tekshiruv oynasi 15 soniya (+8 s server imtiyozi). 6 s oraliqda o'quvchi eng kechi bilan 9 soniya qoladi; 3 s dan 2 barobar
// kam so'rov (1 500 o'quvchida ~500 -> ~250 so'rov/s). Oraliqni 8 s dan oshirmang — oyna juda qisqa qoladi.
const ATTENTION_POLL_MS = 6000;

export function useAttentionCheck(lessonId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: liveKeys.attention(lessonId ?? ""),
    queryFn: ({ signal }) => liveApi.getAttention(lessonId as string, { signal }),
    enabled: Boolean(lessonId && enabled),
    refetchInterval: ATTENTION_POLL_MS,
  });
}

export function useAnswerAttention(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (checkId: string) => liveApi.answerAttention(checkId),
    onSuccess: () => client.setQueryData(liveKeys.attention(lessonId), null),
  });
}

export function useAllowShare(lessonId: string) {
  return useMutation({
    mutationFn: (identity: string) => liveApi.allowShare(lessonId, identity),
    onSuccess: () => toast.success("Ekran ulashish ruxsati berildi"),
  });
}


function micError(error: unknown, forbidden: string): string {
  if (error instanceof AppError) {
    if (error.status === 404) return "Mikrofon so‘rovi serverda hali yoqilmagan.";
    if (error.status === 403) return forbidden;
  }
  return error instanceof Error ? error.message : "Amalni bajarib bo‘lmadi";
}

export function useRequestMic(lessonId: string) {
  return useMutation({
    mutationFn: () => liveApi.requestMic(lessonId),
    onSuccess: () => toast.success("So‘rov yuborildi — o‘qituvchi ruxsatini kuting"),
    onError: (error) => toast.error(micError(error, "Siz bu kursga yozilmagansiz.")),
  });
}

export function useCancelMicRequest(lessonId: string) {
  return useMutation({
    mutationFn: () => liveApi.cancelMicRequest(lessonId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelCameraRequest(lessonId: string) {
  return useMutation({
    mutationFn: () => liveApi.cancelCameraRequest(lessonId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useGrantMic(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.grantMic(lessonId, studentId),
    onSuccess: () => toast.success("Mikrofon ruxsati berildi"),
    onError: (error) => toast.error(micError(error, "Bu darsning o‘qituvchisi emassiz.")),
  });
}

export function useDenyMic(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.denyMic(lessonId, studentId),
    onSuccess: (denied) =>
      toast.success(denied ? "So‘rov rad etildi" : "So‘rov allaqachon yopilgan"),
    onError: (error) => toast.error(micError(error, "Bu darsning o‘qituvchisi emassiz.")),
  });
}

function cameraError(error: unknown, forbidden: string): string {
  if (error instanceof AppError) {
    if (error.status === 404) return "Kamera so‘rovi serverda hali yoqilmagan.";
    if (error.status === 403) return forbidden;
  }
  return error instanceof Error ? error.message : "Amalni bajarib bo‘lmadi";
}

export function useRequestCamera(lessonId: string) {
  return useMutation({
    mutationFn: () => liveApi.requestCamera(lessonId),
    onSuccess: () => toast.success("So‘rov yuborildi — o‘qituvchi ruxsatini kuting"),
    onError: (error) => toast.error(cameraError(error, "Siz bu kursga yozilmagansiz.")),
  });
}

export function useGrantCamera(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.grantCamera(lessonId, studentId),
    onSuccess: () => toast.success("Kamera ruxsati berildi"),
    onError: (error) => toast.error(cameraError(error, "Bu darsning o‘qituvchisi emassiz.")),
  });
}

export function useDenyCamera(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.denyCamera(lessonId, studentId),
    onSuccess: (denied) =>
      toast.success(denied ? "So‘rov rad etildi" : "So‘rov allaqachon yopilgan"),
    onError: (error) => toast.error(cameraError(error, "Bu darsning o‘qituvchisi emassiz.")),
  });
}

function moderationError(error: unknown): string {
  if (error instanceof AppError && error.status === 404) {
    return "Bu imkoniyat serverda hali yoqilmagan.";
  }
  return error instanceof Error ? error.message : "Amalni bajarib bo‘lmadi";
}

export function useInviteToLesson(lessonId: string) {
  return useMutation({
    mutationFn: (studentId?: string) => liveApi.invite(lessonId, studentId),
    onSuccess: (invited, studentId) => {
      toast.success(
        studentId ? "Taklif yuborildi" : `${invited} ta o‘quvchiga taklif yuborildi`
      );
    },
    onError: (error) => toast.error(moderationError(error)),
  });
}

export function useBanFromLesson(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.ban(lessonId, studentId),
    onSuccess: () => toast.success("O‘quvchi darsdan chetlashtirildi"),
    onError: (error) => toast.error(moderationError(error)),
  });
}

export function useUnbanFromLesson(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => liveApi.unban(lessonId, studentId),
    onSuccess: (unbanned) =>
      toast.success(unbanned ? "Chetlashtirish bekor qilindi" : "Chetlashtirish topilmadi"),
    onError: (error) => toast.error(moderationError(error)),
  });
}

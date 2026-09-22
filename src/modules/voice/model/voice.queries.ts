import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { voiceApi } from "../api/voice.api";
import type { VoiceRoomFormValues } from "../api/voice.dto";

export const voiceKeys = Object.freeze({
  all: ["voice-rooms"] as const,
  list: (courseId: string) => ["voice-rooms", "list", courseId] as const,
  requests: (roomId: string) => ["voice-rooms", "requests", roomId] as const,
});

export function useVoiceRooms(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: voiceKeys.list(courseId ?? ""),
    queryFn: ({ signal }) => voiceApi.getAll(courseId as string, { signal }),
    enabled: Boolean(courseId) && enabled,
    refetchInterval: 20_000,
  });
}

export function useActiveVoiceRoom(courseId: string | null, enabled = true) {
  const rooms = useVoiceRooms(courseId, enabled);
  const active = (rooms.data ?? []).find((room) => room.status !== "ended") ?? null;
  return { ...rooms, active };
}

export function useCreateVoiceRoom() {
  const { t } = useTranslation("voice");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: VoiceRoomFormValues) => voiceApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: voiceKeys.all });
      toast.success(t("toast.created"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useJoinVoiceRoom() {
  return useMutation({
    mutationFn: (roomId: string) => voiceApi.join(roomId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLeaveVoiceRoom() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => voiceApi.leave(roomId),
    onSettled: () => client.invalidateQueries({ queryKey: voiceKeys.all }),
  });
}

export function useCloseVoiceRoom() {
  const { t } = useTranslation("voice");
  const client = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => voiceApi.close(roomId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: voiceKeys.all });
      toast.success(t("toast.closed"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRequestVoiceJoin() {
  const { t } = useTranslation("voice");
  return useMutation({
    mutationFn: (roomId: string) => voiceApi.requestJoin(roomId),
    onSuccess: () => toast.success(t("toast.requestSent")),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useVoiceJoinRequests(roomId: string | null, enabled = true) {
  return useQuery({
    queryKey: voiceKeys.requests(roomId ?? ""),
    queryFn: ({ signal }) => voiceApi.getRequests(roomId as string, { signal }),
    enabled: Boolean(roomId) && enabled,
    refetchInterval: 10_000,
  });
}

export function useAnswerVoiceJoinRequest(roomId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, approve }: { requestId: string; approve: boolean }) =>
      approve ? voiceApi.approveRequest(roomId, requestId) : voiceApi.denyRequest(roomId, requestId),
    onSuccess: () => client.invalidateQueries({ queryKey: voiceKeys.requests(roomId) }),
    onError: (error: Error) => toast.error(error.message),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { QueryParams } from "@/shared/api";
import { notificationApi } from "../api/notification.api";
import type { SendNotificationInput } from "../api/notification.dto";

export const notificationKeys = Object.freeze({
  all: ["notifications"] as const,
  inbox: (params: QueryParams = {}) => ["notifications", "inbox", params] as const,
  unread: ["notifications", "unread"] as const,
  sent: (params: QueryParams = {}) => ["notifications", "sent", params] as const,
  recipients: (id: string) => ["notifications", "recipients", id] as const,
  userSearch: (query: string) => ["notifications", "user-search", query] as const,
});

const UNREAD_POLL_MS = 60_000;

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => notificationApi.getUnreadCount({ signal }),
    enabled,
    refetchInterval: (query) => (query.state.data === null ? false : UNREAD_POLL_MS),
    retry: false,
  });
}

export function useNotificationInbox(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.inbox(params),
    queryFn: ({ signal }) => notificationApi.getInbox({ signal, query: params }),
    enabled,
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markRead(notificationId),
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useSendNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SendNotificationInput) => notificationApi.send(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Xabar yuborildi");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSentNotifications(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.sent(params),
    queryFn: ({ signal }) => notificationApi.getSent({ signal, query: params }),
    enabled,
  });
}

export function useNotificationRecipients(notificationId: string | null) {
  return useQuery({
    queryKey: notificationKeys.recipients(notificationId ?? ""),
    queryFn: ({ signal }) => notificationApi.getRecipients(notificationId as string, { signal }),
    enabled: Boolean(notificationId),
  });
}

export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: notificationKeys.userSearch(trimmed),
    queryFn: ({ signal }) => notificationApi.searchUsers(trimmed, { signal }),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}

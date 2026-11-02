import { useEffect } from "react";
import type { OpenNotificationLink } from "../api/notification.dto";
import { NotificationSocketManager } from "../lib/notification-socket-manager";
import { useUnreadNotificationCount } from "./notification.queries";
import { useShowLiveNotification } from "./realtime-hub";
import { useRealtimeHubActive } from "./realtime-hub-context";

export function notificationFeedState(enabled: boolean, count: number | null | undefined) {
  return { available: enabled && count !== null, ready: enabled && typeof count === "number" };
}

export function useNotificationFeed(
  enabled = true,
  onOpenLink?: OpenNotificationLink
) {
  const hubActive = useRealtimeHubActive();
  const showNotification = useShowLiveNotification(onOpenLink);
  const unread = useUnreadNotificationCount(enabled);
  const { available, ready } = notificationFeedState(enabled, unread.data);

  useEffect(() => {
    if (!ready || hubActive) return undefined;
    const socket = new NotificationSocketManager({ onNotification: showNotification });
    socket.start();
    return () => socket.stop();
  }, [ready, hubActive, showNotification]);

  return { available, unreadCount: unread.data ?? 0, isLoading: unread.isLoading };
}

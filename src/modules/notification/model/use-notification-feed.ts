import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { htmlToPlainText } from "@/shared/lib";
import type { OpenNotificationLink } from "../api/notification.dto";
import { NotificationSocketManager } from "../lib/notification-socket-manager";
import { notificationKeys, useUnreadNotificationCount } from "./notification.queries";

export function useNotificationFeed(
  enabled = true,
  onOpenLink?: OpenNotificationLink
) {
  const queryClient = useQueryClient();
  const openLink = useRef(onOpenLink);
  useEffect(() => {
    openLink.current = onOpenLink;
  }, [onOpenLink]);
  const unread = useUnreadNotificationCount(enabled);
  const available = unread.data !== null && unread.data !== undefined;

  useEffect(() => {
    if (!enabled || !available) return undefined;
    const socket = new NotificationSocketManager({
      onNotification: (notification) => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        const preview = htmlToPlainText(notification.html, 90);
        const link = notification.link;
        const open = openLink.current;
        toast.info(preview || "Yangi xabar", {
          description: notification.senderName,
          action: link && open ? { label: "Ochish", onClick: () => open(link, notification.kind) } : undefined,
        });
      },
    });
    socket.start();
    return () => socket.stop();
  }, [enabled, available, queryClient]);

  return { available, unreadCount: unread.data ?? 0, isLoading: unread.isLoading };
}

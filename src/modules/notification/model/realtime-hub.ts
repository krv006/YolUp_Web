import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { htmlToPlainText } from "@/shared/lib";
import type { OpenNotificationLink } from "../api/notification.dto";
import {
  NotificationSocketManager,
  type LiveNotification,
  type RealtimeEvent,
  type SocketState,
} from "../lib/notification-socket-manager";
import { notificationKeys } from "./notification.queries";

export function useShowLiveNotification(onOpenLink?: OpenNotificationLink) {
  const { t } = useTranslation("notification");
  const queryClient = useQueryClient();
  const openLink = useRef(onOpenLink);
  useEffect(() => {
    openLink.current = onOpenLink;
  }, [onOpenLink]);

  return useCallback(
    (notification: LiveNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      const preview = htmlToPlainText(notification.html, 90);
      const link = notification.link;
      const open = openLink.current;
      toast.info(preview || t("liveToast.fallback"), {
        description: notification.senderName,
        action: link && open ? { label: t("liveToast.open"), onClick: () => open(link, notification.kind) } : undefined,
      });
    },
    [queryClient, t]
  );
}

export function useRealtimeSocket(
  enabled: boolean,
  onEvent: (event: RealtimeEvent) => void,
  onState?: (state: SocketState) => void
) {
  const eventRef = useRef(onEvent);
  const stateRef = useRef(onState);
  useEffect(() => {
    eventRef.current = onEvent;
    stateRef.current = onState;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let current = true;
    const socket = new NotificationSocketManager({
      onEvent: (event) => current && eventRef.current(event),
      onState: (state) => current && stateRef.current?.(state),
    });
    socket.start();
    return () => {
      current = false;
      socket.stop();
    };
  }, [enabled]);
}

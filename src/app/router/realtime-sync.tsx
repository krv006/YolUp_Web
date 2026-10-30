import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/modules/auth";
import {
  applyChatActivity,
  applyChatTyping,
  conversationKeys,
  useConversationSync,
} from "@/modules/conversation";
import { useRealtimeSocket, useShowLiveNotification } from "@/modules/notification";
import type { ConversationRole } from "@/shared/types";
import { useOpenNotificationLink } from "@/widgets/notification-link";

export function RealtimeSync({ role }: { role: ConversationRole }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const showNotification = useShowLiveNotification(useOpenNotificationLink());
  const [live, setLive] = useState(false);
  const connectedOnce = useRef(false);
  const userId = user?.id ?? null;

  useRealtimeSocket(
    Boolean(userId),
    (event) => {
      if (event.type === "notification") {
        showNotification(event.notification);
        return;
      }
      if (event.type === "chatActivity") {
        applyChatActivity(queryClient, role, event, userId);
        return;
      }
      applyChatTyping(event.roomId, event, userId);
    },
    (state) => {
      const connected = state === "connected";
      if (connected && connectedOnce.current) {
        void queryClient.invalidateQueries({ queryKey: conversationKeys.list(role), exact: true });
      }
      if (connected) connectedOnce.current = true;
      setLive(connected);
    }
  );

  useConversationSync(role, live);
  return null;
}

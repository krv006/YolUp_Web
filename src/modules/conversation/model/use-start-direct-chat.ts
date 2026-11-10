import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CanMessage } from "@/shared/types";
import { useOpenDirect, useRequestDirect } from "./use-conversations";

export interface DirectChatTarget {
  id: string;
  roomId: string | null;
  canMessage: CanMessage | null;
}

export type DirectChatAction = "open" | "write" | "request" | "none";

export function directChatAction(target: DirectChatTarget): DirectChatAction {
  if (target.roomId) return "open";
  if (target.canMessage === "write") return "write";
  if (target.canMessage === "request") return "request";
  return "none";
}

export function useStartDirectChat(chatRoute: (roomId: string) => string) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const open = useOpenDirect();
  const request = useRequestDirect();

  function start(target: DirectChatTarget, onDone?: () => void) {
    const action = directChatAction(target);
    const go = (roomId: string) => {
      onDone?.();
      navigate(chatRoute(roomId));
    };
    const fail = (error: Error) => toast.error(error.message);

    if (action === "open" && target.roomId) {
      go(target.roomId);
      return;
    }
    if (action === "write") {
      open.mutate(target.id, { onSuccess: (room) => go(room.id), onError: fail });
      return;
    }
    if (action === "request") {
      request.mutate(target.id, {
        onSuccess: (room) => {
          if (room.directStatus !== "active") toast.success(t("panel.directRequestSent"));
          go(room.id);
        },
        onError: fail,
      });
      return;
    }
    toast.info(t("people.cannotMessage"));
  }

  return { start, pending: open.isPending || request.isPending };
}

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Icon } from "@/shared/ui/icon";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { Conversation } from "@/shared/types";
import {
  useLeaveConversation,
  useMuteConversation,
  usePinConversation,
} from "../model/use-conversations";
import { messageApi } from "@/modules/message";

export interface ConversationActionsSheetProps {
  conversation: Conversation | null;
  anchor?: { x: number; y: number } | null;
  onClose: () => void;
}

const MENU_WIDTH = 250;
const MENU_HEIGHT = 216;

export function ConversationActionsSheet({
  conversation,
  anchor = null,
  onClose,
}: ConversationActionsSheetProps) {
  const { t } = useTranslation("chat");
  const isCompact = useIsCompact();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pinRoom = usePinConversation();
  const muteRoom = useMuteConversation();
  const leaveRoom = useLeaveConversation();

  const isPinned = Boolean(conversation?.isPinned);
  const isMuted = Boolean(conversation?.isMuted);

  const actions = [
    {
      id: "pin",
      icon: "pin",
      label: isPinned ? t("actions.unpin") : t("actions.pin"),
      run: () =>
        conversation && pinRoom.mutate({ roomId: conversation.id, pinned: !isPinned }),
    },
    {
      id: "mute",
      icon: "volume",
      label: isMuted ? t("actions.unmute") : t("actions.mute"),
      run: () => conversation && muteRoom.mutate({ roomId: conversation.id, muted: !isMuted }),
    },
    {
      id: "read",
      icon: "done-all",
      label: t("actions.markRead"),
      run: () => conversation && void messageApi.markRead(conversation.id),
    },
  ];

  const menu = conversation && !isCompact && anchor
    ? createPortal(
        <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(event) => event.preventDefault()}>
          <div
            className="absolute flex w-62.5 flex-col rounded-lg bg-surface p-1.5 shadow-xl"
            style={{
              left: Math.min(anchor.x, window.innerWidth - MENU_WIDTH - 12),
              top: Math.min(anchor.y, window.innerHeight - MENU_HEIGHT - 12),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="flex h-12 items-center gap-3 rounded-md px-3 text-left text-body text-ink transition-colors hover:bg-subtle"
                onClick={() => {
                  action.run();
                  onClose();
                }}
              >
                <Icon name={action.icon} size={20} className="shrink-0 text-icon-secondary" />
                {action.label}
              </button>
            ))}
            <span className="my-1.5 h-px shrink-0 bg-line-subtle" />
            <button
              type="button"
              className="flex h-12 items-center gap-3 rounded-md px-3 text-left text-body text-danger transition-colors hover:bg-danger-bg"
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="logout" size={20} className="shrink-0" />
              {t("actions.delete")}
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {menu}

      <Drawer open={Boolean(conversation) && (isCompact || !anchor)} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="rounded-t-2xl border-line bg-surface">
          <DrawerTitle className="px-5 pt-2 pb-3 font-heading text-h3 text-ink">
            {conversation?.title}
          </DrawerTitle>
          <div className="flex flex-col pb-6">
            {actions.map((action) => (
              <button
                key={action.id}
                className="flex items-center gap-4 px-5 py-3.5 text-left text-body text-ink transition-colors hover:bg-subtle"
                onClick={() => {
                  action.run();
                  onClose();
                }}
              >
                <Icon name={action.icon} size={22} className="shrink-0 text-ink-secondary" />
                {action.label}
              </button>
            ))}
            <button
              className="flex items-center gap-4 px-5 py-3.5 text-left text-body text-error-text transition-colors hover:bg-error-bg"
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="trash" size={22} className="shrink-0" />
              {t("actions.delete")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <AppDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="confirm"
        title={t("actions.deleteTitle")}
        description={t("actions.deleteDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setConfirmDelete(false)}
            >
              {t("actions.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              onClick={() => {
                if (conversation)
                  leaveRoom.mutate(conversation.id, {
                    onSuccess: () => toast.success(t("actions.deleted")),
                    onError: (error: Error) => toast.error(error.message),
                  });
                setConfirmDelete(false);
                onClose();
              }}
            >
              {t("actions.confirmDelete")}
            </button>
          </>
        }
      />
    </>
  );
}

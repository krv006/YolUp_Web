import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Icon } from "@/shared/ui/icon";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { Conversation } from "@/shared/types";
import { useConversationPrefsStore } from "../model/conversation-prefs.store";

export interface ConversationActionsSheetProps {
  conversation: Conversation | null;
  onClose: () => void;
}

export function ConversationActionsSheet({
  conversation,
  onClose,
}: ConversationActionsSheetProps) {
  const { t } = useTranslation("chat");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pinned = useConversationPrefsStore((state) => state.pinned);
  const muted = useConversationPrefsStore((state) => state.muted);
  const togglePinned = useConversationPrefsStore((state) => state.togglePinned);
  const toggleMuted = useConversationPrefsStore((state) => state.toggleMuted);

  const isPinned = conversation ? pinned.includes(conversation.id) : false;
  const isMuted = conversation ? muted.includes(conversation.id) : false;

  const actions = [
    {
      id: "pin",
      icon: "pin",
      label: isPinned ? t("actions.unpin") : t("actions.pin"),
      run: () => conversation && togglePinned(conversation.id),
    },
    {
      id: "mute",
      icon: "volume",
      label: isMuted ? t("actions.unmute") : t("actions.mute"),
      run: () => conversation && toggleMuted(conversation.id),
    },
    {
      id: "read",
      icon: "done-all",
      label: t("actions.markRead"),
      run: () => toast.info(t("actions.notAvailable")),
    },
  ];

  return (
    <>
      <Drawer open={Boolean(conversation)} onOpenChange={(open) => !open && onClose()}>
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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl border-line bg-surface">
          <AlertDialogTitle className="font-heading text-h3 text-ink">
            {t("actions.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-body-sm text-ink-secondary">
            {t("actions.deleteDescription")}
          </AlertDialogDescription>
          <AlertDialogFooter className="mt-2 flex-row gap-3">
            <AlertDialogCancel className="h-12 flex-1 rounded-full border border-line bg-surface text-label-strong text-ink">
              {t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-12 flex-1 rounded-full bg-error text-label-strong text-white hover:opacity-90"
              onClick={() => {
                toast.info(t("actions.notAvailable"));
                setConfirmDelete(false);
                onClose();
              }}
            >
              {t("actions.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

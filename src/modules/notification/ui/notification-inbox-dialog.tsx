import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/shared/ui/legacy";
import type { OpenNotificationLink } from "../api/notification.dto";
import { NotificationInboxPanel } from "./notification-inbox-panel";

export interface NotificationInboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLink?: OpenNotificationLink;
}

export function NotificationInboxDialog({
  open,
  onOpenChange,
  onOpenLink,
}: NotificationInboxDialogProps) {
  const { t } = useTranslation("notification");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="notification-dialog" title={t("title")}>
          <NotificationInboxPanel
            embedded
            onOpenLink={onOpenLink}
            onClose={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

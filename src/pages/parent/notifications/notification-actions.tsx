import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useUpdateNotificationPrefsMutation } from "@/modules/auth";
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationsUnread,
  type InboxNotification,
} from "@/modules/notification";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";

export function NotificationActions({
  item,
  onOpen,
  onClose,
}: {
  item: InboxNotification | null;
  onOpen: (item: InboxNotification) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const { user } = useAuth();
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationsUnread();
  const remove = useDeleteNotification();
  const prefs = useUpdateNotificationPrefsMutation();
  const muted = user?.mutedKinds ?? [];
  const kind = item?.kind ?? "";

  function mute() {
    const previous = muted;
    prefs.mutate(
      { mutedKinds: [...muted, kind] },
      {
        onSuccess: () =>
          toast.success(t("mobile.notifications.actions.muted"), {
            action: { label: t("mobile.notifications.actions.undo"), onClick: () => prefs.mutate({ mutedKinds: previous }) },
          }),
      }
    );
  }

  const actions = item
    ? [
        ...(item.link ? [{ id: "open", icon: "arrow-forward", label: t("mobile.notifications.actions.open"), run: () => onOpen(item) }] : []),
        item.isRead
          ? { id: "unread", icon: "mark-chat-unread", label: t("mobile.notifications.actions.unread"), run: () => markUnread.mutate([item.notificationId]) }
          : { id: "read", icon: "check", label: t("mobile.notifications.actions.read"), run: () => markRead.mutate(item.notificationId) },
        ...(kind && !muted.includes(kind)
          ? [{ id: "mute", icon: "notifications-off", label: t("mobile.notifications.actions.mute"), run: mute }]
          : []),
        {
          id: "delete",
          icon: "delete",
          label: t("mobile.notifications.actions.delete"),
          danger: true,
          run: () =>
            remove.mutate(item.notificationId, {
              onSuccess: () => toast.success(t("mobile.notifications.actions.deleted")),
              onError: () => toast.error(t("mobile.notifications.actions.failed")),
            }),
        },
      ]
    : [];

  return (
    <AppDialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="sheet"
      title={item?.title || t("mobile.notifications.actions.title")}
      description={item?.body || undefined}
    >
      <ul className="flex flex-col overflow-hidden rounded-2xl bg-subtle pb-0">
        {actions.map((action) => (
          <li key={action.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              className={`flex h-14 w-full items-center gap-3 px-4 text-left text-title-sm ${"danger" in action ? "text-error-text" : "text-ink"}`}
              onClick={() => {
                action.run();
                onClose();
              }}
            >
              <Icon name={action.icon} size={22} className={"danger" in action ? "" : "text-icon-secondary"} />
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </AppDialog>
  );
}

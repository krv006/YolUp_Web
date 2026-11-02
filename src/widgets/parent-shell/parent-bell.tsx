import { NotificationBell } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useParentNotificationLink } from "./use-parent-notification-link";

export function ParentBell() {
  const openLink = useParentNotificationLink();
  return (
    <NotificationBell
      filters="category"
      pageHref={ROUTES.parent.notifications}
      onOpenLink={openLink}
      className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
    />
  );
}

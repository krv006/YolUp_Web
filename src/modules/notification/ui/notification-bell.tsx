import { useState } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useNotificationFeed } from "../model/use-notification-feed";
import type { NotificationLink } from "../api/notification.dto";
import { NotificationInboxPanel } from "./notification-inbox-panel";

export interface NotificationBellProps {
  enabled?: boolean;
  className?: string;
  onOpenLink?: (link: NotificationLink) => void;
}

export function NotificationBell({
  enabled = true,
  className = "notification-bell",
  onOpenLink,
}: NotificationBellProps) {
  const { t } = useTranslation("notification");
  const [open, setOpen] = useState(false);
  const { available, unreadCount } = useNotificationFeed(enabled, onOpenLink);

  if (!available) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={className}
          aria-label={unreadCount ? t("unreadAria", { count: unreadCount }) : t("openAria")}
        >
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl"
      >
        {open ? (
          <NotificationInboxPanel onOpenLink={onOpenLink} onClose={() => setOpen(false)} />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

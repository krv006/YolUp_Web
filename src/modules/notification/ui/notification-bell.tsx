import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useNotificationFeed } from "../model/use-notification-feed";
import type { NotificationLink } from "../api/notification.dto";
import { NotificationInboxPanel } from "./notification-inbox-panel";

export interface NotificationBellProps {
  enabled?: boolean;
  className?: string;
  /** Phones open this route instead of the popover. */
  pageHref?: string;
  onOpenLink?: (link: NotificationLink) => void;
}

export function NotificationBell({
  enabled = true,
  className = "notification-bell",
  pageHref,
  onOpenLink,
}: NotificationBellProps) {
  const { t } = useTranslation("notification");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { available, unreadCount } = useNotificationFeed(enabled, onOpenLink);

  if (!available) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next && pageHref && window.matchMedia("(max-width: 1023px)").matches) {
          navigate(pageHref);
          return;
        }
        setOpen(next);
      }}
    >
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

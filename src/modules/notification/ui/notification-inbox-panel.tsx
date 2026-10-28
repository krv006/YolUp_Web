import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { formatMessageTime } from "@/shared/lib";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
} from "../model/notification.queries";
import type { InboxNotification, NotificationLink } from "../api/notification.dto";
import {
  notificationActionKey,
  notificationGroupKey,
  notificationIcon,
  notificationLines,
  type NotificationGroupKey,
} from "../lib/notification-display";

export interface NotificationInboxPanelProps {
  onOpenLink?: (link: NotificationLink) => void;
  onClose: () => void;
  /** Rendered inside a dialog or page that already shows the title. */
  embedded?: boolean;
  /** Fills the available width instead of the popover's fixed one. */
  fullWidth?: boolean;
  unreadOnly?: boolean;
}

export function NotificationInboxPanel({
  onOpenLink,
  onClose,
  embedded = false,
  fullWidth = false,
  unreadOnly = false,
}: NotificationInboxPanelProps) {
  const { t } = useTranslation("notification");
  const inbox = useNotificationInbox({ page_size: 30 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [tab, setTab] = useState<"all" | "unread">(unreadOnly ? "unread" : "all");

  const all = inbox.data?.items ?? [];
  const unreadCount = all.filter((item) => !item.isRead).length;
  const items = tab === "unread" ? all.filter((item) => !item.isRead) : all;

  const groups = (["today", "yesterday", "earlier"] as NotificationGroupKey[])
    .map((key) => ({ key, items: items.filter((item) => notificationGroupKey(item.createdAt) === key) }))
    .filter((group) => group.items.length > 0);

  function openItem(item: InboxNotification) {
    if (!item.isRead) markRead.mutate(item.notificationId);
    if (item.link && onOpenLink) {
      onOpenLink(item.link);
      onClose();
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        fullWidth ? "h-full w-full" : `max-h-[560px] ${embedded ? "w-full" : "w-[420px]"}`
      }`}
    >
      <div className="flex items-center gap-3 px-[18px] pt-5 pb-3.5">
        {embedded ? (
          <span className="flex-1" />
        ) : (
          <strong className="min-w-0 flex-1 truncate text-title text-ink">{t("title")}</strong>
        )}
        {unreadCount ? (
          <button
            className="shrink-0 text-caption-strong text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>

      {inbox.isSuccess && all.length ? (
        <div className="grid grid-cols-2 gap-2 px-[18px] pb-3">
          {(["all", "unread"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`flex h-9 items-center justify-center rounded-full border px-4 text-body-sm transition-colors ${
                tab === id
                  ? "border-brand bg-brand text-ink-inverse"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
              onClick={() => setTab(id)}
            >
              {id === "all" ? t("tabs.all") : t("tabs.unread", { count: unreadCount })}
            </button>
          ))}
        </div>
      ) : null}

      {inbox.isLoading ? (
        <div className="flex flex-col gap-3 px-5 pb-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3">
              <span className="size-10 shrink-0 rounded-xl bg-muted" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <i className="h-2.5 w-4/5 rounded-full bg-muted" />
                <i className="h-2.5 w-2/5 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {inbox.isError ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <strong className="text-title text-ink">{t("loadError")}</strong>
          <button
            className="mt-2 flex h-10 items-center rounded-full bg-muted px-4 text-label text-ink transition-colors hover:bg-subtle"
            onClick={() => inbox.refetch()}
          >
            {t("retry")}
          </button>
        </div>
      ) : null}

      {inbox.isSuccess && !items.length ? (
        <div className="flex flex-col items-center gap-2 px-8 py-12 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-brand-subtle text-brand">
            <Icon name="notifications-off" size={28} />
          </span>
          <strong className="mt-2 font-heading text-h2 text-ink">{t("emptyTitle")}</strong>
          <p className="max-w-[280px] text-body-sm text-ink-secondary">{t("emptyDescription")}</p>
        </div>
      ) : null}

      {groups.length ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[18px] pb-[18px]">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <span className="text-body text-ink">{t(`groups.${group.key}`)}</span>
              <div className="flex flex-col overflow-hidden rounded-2xl">
                {group.items.map((item) => {
                  const { icon, tone } = notificationIcon(item);
                  const action = notificationActionKey(item.link);
                  const { title, body } = notificationLines(item.html);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex items-start gap-3 border-b border-line px-4 py-4 text-left transition-colors last:border-b-0 ${
                        item.isRead ? "bg-surface hover:bg-subtle" : "bg-brand-subtle"
                      }`}
                      onClick={() => openItem(item)}
                    >
                      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${tone}`}>
                        <Icon name={icon} size={20} />
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="line-clamp-2 text-[15px]/5 font-semibold text-ink">{title}</strong>
                        {body ? (
                          <small className="mt-1 line-clamp-2 text-body-xs text-ink-secondary">{body}</small>
                        ) : null}
                        {action ? (
                          <span className="mt-1 text-body-sm font-medium text-brand">{t(`actions.${action}`)}</span>
                        ) : null}
                      </span>

                      <span className="flex shrink-0 flex-col items-end gap-2">
                        <small className="text-body-xs text-ink-secondary">
                          {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                        </small>
                        {item.isRead ? null : (
                          <span className="size-2 rounded-full bg-brand" aria-label={t("markRead")} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

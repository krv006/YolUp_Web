import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  NOTIFICATION_CATEGORIES,
  NotificationHtml,
  notificationCategory,
  notificationGroupKey,
  notificationIcon,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsUnread,
  useNotificationInbox,
  type InboxNotification,
  type NotificationCategory,
  type NotificationGroupKey,
} from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatNotificationTime } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader, mobileRoundButton } from "@/shared/ui/mobile-page";
import { useParentNotificationLink } from "@/widgets/parent-shell";
import { NotificationActions } from "./notification-actions";

const GROUPS: NotificationGroupKey[] = ["today", "yesterday", "earlier"];

export function ParentNotificationsPage() {
  const { t } = useTranslation("notification");
  const { t: tp } = useTranslation("parent");
  const navigate = useNavigate();
  const compact = useIsCompact();
  const inbox = useNotificationInbox({ page_size: 30 }, compact);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const markUnread = useMarkNotificationsUnread();
  const openLink = useParentNotificationLink();
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [acting, setActing] = useState<InboxNotification | null>(null);
  if (!compact) return <Navigate to={ROUTES.parent.dashboard} replace />;

  const all = inbox.data?.items ?? [];
  const items = category === "all" ? all : all.filter((item) => notificationCategory(item) === category);
  const unread = all.filter((item) => !item.isRead).length;
  function open(item: InboxNotification) {
    if (!item.isRead) markRead.mutate(item.notificationId);
    if (item.link) openLink(item.link, item.kind, item.data);
  }

  function readAll() {
    const ids = all.filter((item) => !item.isRead).map((item) => item.notificationId);
    markAll.mutate(undefined, {
      onSuccess: () =>
        toast.success(tp("mobile.notifications.actions.allRead", { count: ids.length }), {
          action: { label: tp("mobile.notifications.actions.undo"), onClick: () => markUnread.mutate(ids) },
        }),
    });
  }

  const groups = GROUPS.map((key) => ({ key, items: items.filter((item) => notificationGroupKey(item.createdAt) === key) })).filter(
    (group) => group.items.length
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8">
      <MobilePageHeader
        title={t("title")}
        backLabel={t("back")}
        onBack={() => navigate(-1)}
        action={
          unread ? (
            <button type="button" className={mobileRoundButton} aria-label={t("markAllRead")} disabled={markAll.isPending} onClick={readAll}>
              <Icon name="done-all" size={22} />
            </button>
          ) : undefined
        }
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {(["all", ...NOTIFICATION_CATEGORIES] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`flex h-11 shrink-0 items-center rounded-full px-5 text-title-sm font-medium transition-colors ${
              category === id ? "bg-brand text-on-action" : "bg-surface text-ink"
            }`}
            onClick={() => setCategory(id)}
          >
            {t(`categories.${id}`)}
          </button>
        ))}
      </div>

      {inbox.isLoading ? <div className="h-64 animate-pulse rounded-[20px] bg-surface" aria-hidden="true" /> : null}

      {inbox.isSuccess && !items.length ? (
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="notifications-off" size={30} />
          </span>
          <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("emptyTitle")}</strong>
          <p className="text-body-sm text-ink-secondary">{tp("mobile.notifications.empty")}</p>
          <button
            type="button"
            className="mt-1 flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action"
            onClick={() => navigate(ROUTES.parent.settings())}
          >
            <Icon name="settings" size={18} />
            {tp("mobile.notifications.settings")}
          </button>
        </div>
      ) : null}

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <small className="px-1 text-body-sm text-ink-secondary">{t(`groups.${group.key}`)}</small>
          <div className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
            {group.items.map((item) => {
              const { icon, tone } = notificationIcon(item);
              return (
                <div key={item.id} className={`flex items-start border-b border-line last:border-b-0 ${item.isRead ? "" : "bg-brand-subtle"}`}>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-4 text-left"
                    onClick={() => open(item)}
                  >
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                      <Icon name={icon} size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {item.title ? (
                        <>
                          <strong className="line-clamp-2 text-title-sm text-ink">{item.title}</strong>
                          {item.body ? <span className="line-clamp-2 text-body-xs text-ink-secondary">{item.body}</span> : null}
                        </>
                      ) : (
                        <NotificationHtml className="line-clamp-3 text-body-xs text-ink-secondary [&_b]:block [&_b]:text-title-sm [&_b]:text-ink" html={item.html} />
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <small className="text-caption text-ink-secondary">{item.createdAt ? formatNotificationTime(item.createdAt) : ""}</small>
                      {item.isRead ? null : <i className="size-2 rounded-full bg-brand not-italic" />}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="grid h-12 w-11 shrink-0 place-items-center text-icon-tertiary"
                    aria-label={tp("mobile.notifications.actions.title")}
                    onClick={() => setActing(item)}
                  >
                    <Icon name="more-horiz" size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <NotificationActions item={acting} onOpen={open} onClose={() => setActing(null)} />
    </div>
  );
}

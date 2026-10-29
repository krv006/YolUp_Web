import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  NotificationHtml,
  notificationActionKey,
  notificationGroupKey,
  notificationIcon,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
  type NotificationGroupKey,
} from "@/modules/notification";
import { formatMessageTime } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobilePageHeader, MobileSegment } from "@/shared/ui/mobile-page";
import { useOpenNotificationLink } from "@/widgets/notification-link";

const GROUP_ORDER: NotificationGroupKey[] = ["today", "yesterday", "earlier"];

export function NotificationsPage() {
  const { t } = useTranslation("notification");
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const inbox = useNotificationInbox({ page_size: 30 }, true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const openLink = useOpenNotificationLink();

  const all = inbox.data?.items ?? [];
  const unreadCount = all.filter((item) => !item.isRead).length;
  const items = tab === "unread" ? all.filter((item) => !item.isRead) : all;
  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: items.filter((item) => notificationGroupKey(item.createdAt) === key),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink">
      <div className="mx-auto flex max-w-2xl flex-col">
        <MobilePageHeader
          title={t("title")}
          backLabel={t("back")}
          onBack={() => navigate(-1)}
          action={
            unreadCount ? (
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:opacity-50"
                aria-label={t("markAllRead")}
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <Icon name="done-all" size={22} />
              </button>
            ) : undefined
          }
        />

        <div className="mt-5">
          <MobileSegment
            items={[
              { id: "all", label: t("tabs.all") },
              {
                id: "unread",
                label: unreadCount ? t("tabs.unread", { count: unreadCount }) : t("tabs.unreadPlain"),
              },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {inbox.isLoading ? (
          <div className="mt-6 flex flex-col overflow-hidden rounded-xl bg-surface">
            {Array.from({ length: 3 }, (_, index) => (
              <span
                key={index}
                className="flex animate-pulse items-start gap-3 border-b border-line px-4 py-4 last:border-b-0"
              >
                <i className="size-10 shrink-0 rounded-lg bg-subtle not-italic" />
                <span className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
                  <i className="h-3 w-40 rounded-full bg-subtle not-italic" />
                  <i className="h-3 w-56 rounded-full bg-subtle not-italic" />
                </span>
              </span>
            ))}
          </div>
        ) : null}

        {inbox.isError ? (
          <div className="mt-6">
            <MobileEmptyCard icon="wifi" title={t("loadError")} />
          </div>
        ) : null}

        {inbox.isSuccess && !items.length ? (
          <div className="mt-5">
            <MobileEmptyCard icon="notifications" title={t("emptyTitle")} description={t("emptyDescription")} />
          </div>
        ) : null}

        {groups.map((group) => (
          <section key={group.key} className="mt-5 flex flex-col gap-3">
            <h2 className="text-body text-ink">{t(`groups.${group.key}`)}</h2>
            <div className="flex flex-col overflow-hidden rounded-xl bg-surface">
              {group.items.map((item) => {
                const { icon, tone } = notificationIcon(item);
                const action = notificationActionKey(item.link);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex items-start gap-3 border-b border-line px-4 py-3.5 text-left transition-colors last:border-b-0 ${
                      item.isRead ? "hover:bg-subtle" : "bg-brand-subtle"
                    }`}
                    onClick={() => {
                      if (!item.isRead) markRead.mutate(item.notificationId);
                      if (item.link) openLink(item.link, item.kind);
                    }}
                  >
                    <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}>
                      <Icon name={icon} size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      {item.title ? (
                        <span className="flex flex-col gap-1">
                          <strong className="line-clamp-2 text-title text-ink">{item.title}</strong>
                          {item.body ? <span className="line-clamp-3 text-body-sm text-ink-secondary">{item.body}</span> : null}
                        </span>
                      ) : (
                        <NotificationHtml
                          className="line-clamp-3 text-body-sm text-ink-secondary [&_b]:mb-1 [&_b]:block [&_b]:text-title [&_b]:text-ink [&_strong]:mb-1 [&_strong]:block [&_strong]:text-title [&_strong]:text-ink"
                          html={item.html}
                        />
                      )}
                      {action ? (
                        <span className="text-body-sm font-semibold text-brand-strong">
                          {t(`actions.${action}`)}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-2.5 pt-0.5">
                      <small className="text-caption text-ink-secondary">
                        {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                      </small>
                      {item.isRead ? null : <i className="size-2 rounded-full bg-brand not-italic" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

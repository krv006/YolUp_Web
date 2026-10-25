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
import { NotificationHtml } from "./notification-html";

const LESSON_REMINDER_KIND = "lesson_reminder";

type GroupKey = "today" | "yesterday" | "earlier";

const TONES = {
  lesson: "bg-accent-saffron-bg text-accent-saffron-fg",
  people: "bg-accent-green-bg text-accent-green-fg",
  action: "bg-accent-blue-bg text-accent-blue-fg",
  neutral: "bg-subtle text-icon-secondary",
};

function iconFor(item: InboxNotification) {
  if (item.kind === LESSON_REMINDER_KIND) return { icon: "clock", tone: TONES.lesson };
  if (item.kind?.includes("rating") || item.kind?.includes("grade"))
    return { icon: "star", tone: TONES.people };
  if (item.link?.type === "submission") return { icon: "check-circle", tone: TONES.people };
  if (item.link?.type === "assignment") return { icon: "assign", tone: TONES.lesson };
  if (item.link?.type === "quiz") return { icon: "quiz", tone: TONES.action };
  if (item.targetType === "all") return { icon: "campaign", tone: TONES.action };
  if (item.kind === "mention") return { icon: "alternate-email", tone: TONES.action };
  return { icon: "person-add", tone: TONES.neutral };
}

function actionKey(link: NotificationLink | null): string | null {
  if (!link) return null;
  if (link.type === "assignment") return "openAssignment";
  if (link.type === "quiz" || link.type === "exam") return "openQuiz";
  if (link.type === "course") return "review";
  return "open";
}

function groupKeyOf(value: string): GroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "today";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterday";
  return "earlier";
}

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

  const groups = (["today", "yesterday", "earlier"] as GroupKey[])
    .map((key) => ({ key, items: items.filter((item) => groupKeyOf(item.createdAt) === key) }))
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
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        {embedded ? (
          <span className="flex-1" />
        ) : (
          <strong className="min-w-0 flex-1 truncate text-title-lg text-ink">{t("title")}</strong>
        )}
        {unreadCount ? (
          <button
            className="shrink-0 text-label-sm text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>

      {inbox.isSuccess && all.length ? (
        <div className="grid grid-cols-2 px-5 pb-3">
          {(["all", "unread"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`flex h-9 items-center justify-center rounded-full px-4 text-label transition-colors ${
                tab === id
                  ? "bg-brand text-ink-inverse"
                  : "text-ink-secondary hover:bg-subtle hover:text-ink"
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
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1">
              <span className="px-2 pt-1 pb-1 text-caption-strong text-ink-tertiary">
                {t(`groups.${group.key}`)}
              </span>
              {group.items.map((item) => {
                const { icon, tone } = iconFor(item);
                const action = actionKey(item.link);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                      item.isRead ? "hover:bg-subtle" : "bg-brand-subtle/60 hover:bg-brand-subtle"
                    }`}
                    onClick={() => openItem(item)}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                      <Icon name={icon} size={20} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <NotificationHtml
                        className="line-clamp-2 text-body-sm text-ink"
                        html={item.html}
                      />
                      {action ? (
                        <span className="text-label text-brand">{t(`actions.${action}`)}</span>
                      ) : (
                        <small className="truncate text-caption text-ink-tertiary">
                          {item.sender?.name ?? t("system")}
                        </small>
                      )}
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <small className="text-caption text-ink-tertiary">
                        {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                      </small>
                      {item.isRead ? null : (
                        <span
                          className="size-2 rounded-full bg-brand"
                          aria-label={t("markRead")}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

const TONES: Record<string, string> = {
  lesson: "bg-saffron-subtle text-saffron-strong",
  people: "bg-success-bg text-success-text",
  mention: "bg-action-subtle text-action",
  done: "bg-success-bg text-success-text",
  default: "bg-action-subtle text-action",
};

function iconFor(item: InboxNotification) {
  if (item.kind === LESSON_REMINDER_KIND) return { icon: "clock", tone: TONES.lesson };
  if (item.link?.type === "submission") return { icon: "check-circle", tone: TONES.done };
  if (item.link?.type === "assignment" || item.link?.type === "quiz")
    return { icon: "assign", tone: TONES.default };
  if (item.targetType === "all") return { icon: "bell", tone: TONES.mention };
  if (item.kind === "mention") return { icon: "person", tone: TONES.mention };
  return { icon: "groups", tone: TONES.people };
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
  const all = inbox.data?.items ?? [];
  const items = unreadOnly ? all.filter((item) => !item.isRead) : all;
  const unread = items.filter((item) => !item.isRead);

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
        fullWidth ? "h-full w-full" : `max-h-[520px] ${embedded ? "w-full" : "w-[360px]"}`
      }`}
    >
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        {embedded ? (
          <span className="flex-1" />
        ) : (
          <strong className="flex-1 text-title text-ink">{t("title")}</strong>
        )}
        {unread.length ? (
          <button
            className="text-label-strong text-action transition-opacity hover:opacity-80 disabled:opacity-50"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>

      {inbox.isLoading ? (
        <div className="flex flex-col gap-3 px-5 pb-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3">
              <span className="size-9 shrink-0 rounded-full bg-muted" />
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
            className="mt-2 flex h-10 items-center rounded-full bg-muted px-4 text-label-strong text-ink transition-colors hover:bg-subtle"
            onClick={() => inbox.refetch()}
          >
            {t("retry")}
          </button>
        </div>
      ) : null}

      {inbox.isSuccess && !items.length ? (
        <div className="flex flex-col items-center gap-2 px-8 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
            <Icon name="bell" size={28} />
          </span>
          <strong className="mt-2 font-heading text-h3 text-ink">{t("emptyTitle")}</strong>
          <p className="text-body-sm text-ink-secondary">{t("emptyDescription")}</p>
        </div>
      ) : null}

      {groups.length ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1.5">
              <span className="px-2 pt-2 text-label-strong text-ink-tertiary">
                {t(`groups.${group.key}`)}
              </span>
              <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
                {group.items.map((item) => {
                  const { icon, tone } = iconFor(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-subtle"
                      onClick={() => openItem(item)}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}
                      >
                        <Icon name={icon} size={17} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <NotificationHtml
                          className="line-clamp-2 text-label text-ink"
                          html={item.html}
                        />
                        <small className="truncate text-caption text-ink-tertiary">
                          {item.sender?.name ?? t("system")} ·{" "}
                          {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                        </small>
                      </span>
                      {item.isRead ? null : (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-action"
                          aria-label={t("markRead")}
                        />
                      )}
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

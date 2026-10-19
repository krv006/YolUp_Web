import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { NotificationInboxPanel } from "@/modules/notification";
import { useNotificationInbox } from "@/modules/notification";
import { Icon } from "@/shared/ui/icon";

export function NotificationsPage() {
  const { t } = useTranslation("notification");
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const inbox = useNotificationInbox({ page_size: 30 }, true);
  const unreadCount = (inbox.data?.items ?? []).filter((item) => !item.isRead).length;

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
          onClick={() => navigate(-1)}
          aria-label={t("openAria")}
        >
          <Icon name="arrow-back" size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">{t("title")}</h1>
      </header>

      <div className="flex shrink-0 items-center gap-2 px-4 pb-2 lg:px-6">
        {[
          { id: "all", label: t("filterAll"), active: !unreadOnly },
          {
            id: "unread",
            label: t("filterUnread", { count: unreadCount }),
            active: unreadOnly,
          },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`flex h-9 items-center rounded-full border px-4 text-caption-strong transition-colors ${
              chip.active
                ? "border-action bg-action-subtle text-action"
                : "border-line bg-surface text-ink-secondary hover:bg-subtle"
            }`}
            onClick={() => setUnreadOnly(chip.id === "unread")}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <NotificationInboxPanel
          embedded
          fullWidth
          unreadOnly={unreadOnly}
          onClose={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

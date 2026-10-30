import { useState } from "react";
import { Check, Clock3, Megaphone, Plus, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/shared/lib";
import { Button, Dialog, DialogContent, LoadingFallback } from "@/shared/ui/legacy";
import {
  useNotificationRecipients,
  useSentNotifications,
} from "../model/notification.queries";
import { NotificationHtml } from "./notification-html";
import { SendNotificationDialog } from "./send-notification-dialog";

export function SentNotificationsPanel() {
  const { t } = useTranslation("notification");
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sent = useSentNotifications({ page_size: 30 });
  const recipients = useNotificationRecipients(detailId);
  const items = sent.data?.items ?? [];

  if (sent.isError) return null;

  return (
    <section className="portal-panel">
      <div className="portal-section-heading">
        <div>
          <span className="portal-eyebrow">{t("sentPanel.eyebrow")}</span>
          <h2>{t("sentPanel.title")}</h2>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus size={17} /> {t("sentPanel.compose")}
        </Button>
      </div>

      {sent.isLoading ? <LoadingFallback label={t("sentPanel.loading")} /> : null}

      {sent.isSuccess && !items.length ? (
        <p className="portal-muted">{t("sentPanel.empty")}</p>
      ) : null}

      {items.length ? (
        <div className="sent-notification-list">
          {items.map((item) => {
            const rate = item.totalCount
              ? Math.round((item.readCount / item.totalCount) * 100)
              : 0;
            return (
              <button key={item.id} type="button" onClick={() => setDetailId(item.id)}>
                <span className="sent-notification-icon">
                  {item.targetType === "all" ? <Megaphone size={16} /> : <UserRound size={16} />}
                </span>
                <span className="sent-notification-body">
                  <NotificationHtml html={item.html} className="is-preview" />
                  <small>
                    <Clock3 size={12} /> {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                  </small>
                </span>
                <span className="sent-notification-stat">
                  <strong>
                    {item.readCount}/{item.totalCount}
                  </strong>
                  <i>{t("sentPanel.readRate", { rate })}</i>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <SendNotificationDialog open={composeOpen} onOpenChange={setComposeOpen} />

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        {detailId ? (
          <DialogContent title={t("sentPanel.readersTitle")} description={t("sentPanel.readersDescription")}>
            {recipients.isLoading ? <LoadingFallback label={t("sentPanel.readersLoading")} /> : null}
            {recipients.data?.length ? (
              <ul className="notification-recipients">
                {recipients.data.map((row) => (
                  <li key={row.id} className={row.readAt ? "is-read" : ""}>
                    <span>
                      <strong>{row.name}</strong>
                      <small>@{row.username}</small>
                    </span>
                    {row.readAt ? (
                      <em>
                        <Check size={13} /> {formatDateTime(row.readAt)}
                      </em>
                    ) : (
                      <em className="is-pending">{t("sentPanel.unread")}</em>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {recipients.isSuccess && !recipients.data.length ? (
              <p className="portal-muted">{t("sentPanel.noRecipients")}</p>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

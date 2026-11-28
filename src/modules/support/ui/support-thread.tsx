import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { SupportTicketStatus } from "../api/support.dto";
import { useCloseSupportTicket, useReplySupportTicket, useSupportTicket } from "../model/support.queries";

const FIELD =
  "w-full rounded-xl border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

const STATUS_TONE: Record<SupportTicketStatus, string> = {
  open: "bg-warning-bg text-warning-fg",
  answered: "bg-success-bg text-success-fg",
  closed: "bg-subtle text-ink-secondary",
};

function stamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function SupportThread({ id, onBack, staffView = false }: { id: string; onBack: () => void; staffView?: boolean }) {
  const { t } = useTranslation("account");
  const ticket = useSupportTicket(id);
  const reply = useReplySupportTicket(id);
  const close = useCloseSupportTicket(id);
  const [message, setMessage] = useState("");
  const data = ticket.data;
  const closed = data?.status === "closed";

  if (ticket.isLoading || !data)
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <i className="h-6 w-56 rounded-full bg-skeleton" />
        <i className="h-20 rounded-xl bg-skeleton" />
        <i className="ml-auto h-16 w-3/4 rounded-xl bg-skeleton" />
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-tint"
          aria-label={t("support.back")}
          onClick={onBack}
        >
          <Icon name="arrow-back" size={18} />
        </button>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-title text-ink">{data.subject}</strong>
          <small className="text-caption text-ink-tertiary">{stamp(data.createdAt)}</small>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-caption-strong ${STATUS_TONE[data.status]}`}>
          {t(`support.status.${data.status}`)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.messages.map((item) => (
          <div
            key={item.id}
            className={`flex max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-2.5 ${
              item.fromStaff === staffView ? "self-end bg-brand-subtle text-ink" : "self-start bg-subtle text-ink"
            }`}
          >
            <small className="text-caption-strong text-ink-secondary">
              {item.fromStaff === staffView ? t("support.you") : staffView ? item.author || t("support.user") : t("support.staff")} ·{" "}
              {stamp(item.createdAt)}
            </small>
            <p className="text-body-sm whitespace-pre-line">{item.body}</p>
          </div>
        ))}
      </div>

      {closed ? (
        <p className="rounded-xl bg-subtle px-4 py-3 text-center text-body-sm text-ink-secondary">{t("support.closedNote")}</p>
      ) : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!message.trim()) return;
            reply.mutate({ message: message.trim() }, {
              onSuccess: () => setMessage(""),
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          <textarea
            className={`${FIELD} min-h-24 resize-y py-3`}
            value={message}
            maxLength={5000}
            placeholder={t("support.replyPlaceholder")}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={dialogButton.secondary}
              disabled={close.isPending}
              onClick={() => close.mutate(undefined, { onError: (error) => toast.error(error.message) })}
            >
              {t("support.close")}
            </button>
            <button type="submit" className={dialogButton.primary} disabled={!message.trim() || reply.isPending}>
              {t("support.send")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

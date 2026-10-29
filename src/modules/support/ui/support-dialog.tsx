import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { SupportTicket, SupportTicketStatus } from "../api/support.dto";
import {
  useCloseSupportTicket,
  useCreateSupportTicket,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "../model/support.queries";

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

export interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
}

type View = { kind: "list" } | { kind: "new" } | { kind: "thread"; id: string };

export function SupportDialog({ open, onOpenChange, ticketId = null }: SupportDialogProps) {
  const { t } = useTranslation("account");
  const [view, setView] = useState<View>(ticketId ? { kind: "thread", id: ticketId } : { kind: "list" });
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) setView(ticketId ? { kind: "thread", id: ticketId } : { kind: "list" });
  }

  const title =
    view.kind === "new" ? t("support.newTitle") : view.kind === "thread" ? t("support.threadTitle") : t("support.title");

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="panel"
      width="lg:w-[480px]"
      title={title}
      description={view.kind === "list" ? t("support.subtitle") : undefined}
    >
      {view.kind === "list" ? (
        <TicketList onNew={() => setView({ kind: "new" })} onOpen={(id) => setView({ kind: "thread", id })} />
      ) : view.kind === "new" ? (
        <NewTicket onBack={() => setView({ kind: "list" })} onCreated={(id) => setView({ kind: "thread", id })} />
      ) : (
        <SupportThread id={view.id} onBack={() => setView({ kind: "list" })} />
      )}
    </AppDialog>
  );
}

function TicketList({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { t } = useTranslation("account");
  const tickets = useSupportTickets();
  const items = tickets.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={`${dialogButton.primary} w-full flex-none`} onClick={onNew}>
        <Icon name="add" size={18} />
        {t("support.new")}
      </button>
      {tickets.isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => (
            <i key={index} className="h-16 rounded-xl bg-skeleton" />
          ))}
        </div>
      ) : items.length ? (
        items.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onOpen={() => onOpen(ticket.id)} />)
      ) : (
        <p className="py-8 text-center text-body-sm text-ink-secondary">{t("support.empty")}</p>
      )}
    </div>
  );
}

function TicketRow({ ticket, onOpen }: { ticket: SupportTicket; onOpen: () => void }) {
  const { t } = useTranslation("account");
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:bg-subtle"
      onClick={onOpen}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-label-strong text-ink">{ticket.subject}</strong>
        <small className="truncate text-caption text-ink-tertiary">
          {[ticket.lastMessage, stamp(ticket.updatedAt)].filter(Boolean).join(" · ")}
        </small>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-caption-strong ${STATUS_TONE[ticket.status]}`}>
        {t(`support.status.${ticket.status}`)}
      </span>
    </button>
  );
}

function NewTicket({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const { t } = useTranslation("account");
  const create = useCreateSupportTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        create.mutate(
          { subject: subject.trim(), message: message.trim() },
          {
            onSuccess: (ticket) => {
              toast.success(t("support.sent"));
              onCreated(ticket.id);
            },
            onError: (error) => toast.error(error.message),
          }
        );
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("support.subject")}</span>
        <input
          className={`${FIELD} h-12.5`}
          value={subject}
          maxLength={200}
          autoFocus
          placeholder={t("support.subjectPlaceholder")}
          onChange={(event) => setSubject(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("support.message")}</span>
        <textarea
          className={`${FIELD} min-h-32 resize-y py-3`}
          value={message}
          maxLength={5000}
          placeholder={t("support.messagePlaceholder")}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={dialogButton.secondary} onClick={onBack}>
          {t("support.back")}
        </button>
        <button
          type="submit"
          className={dialogButton.primary}
          disabled={!subject.trim() || !message.trim() || create.isPending}
        >
          {t("support.send")}
        </button>
      </div>
    </form>
  );
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
            reply.mutate(message.trim(), {
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

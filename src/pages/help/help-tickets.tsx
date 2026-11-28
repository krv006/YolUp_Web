import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  filterTickets,
  groupTickets,
  markTicketSeen,
  staffName,
  ticketLabel,
  ticketTopic,
  ticketUnread,
  useCloseSupportTicket,
  useHelpConfig,
  useRateSupportTicket,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
  type SupportAttachment,
  type SupportTicket,
  type TicketFilter,
} from "@/modules/support";
import { apiClient } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useOnline } from "@/shared/hooks/use-online";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Icon } from "@/shared/ui/icon";
import { mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { EmptyBlock, RowsSkeleton, StatusChip } from "./help-ui";
import { useHelpDate, useHelpPaths, useReplyMinutes } from "./use-help";

const FILTERS: TicketFilter[] = ["all", "open", "answered", "closed"];
const RATING_TAGS = ["fast", "clear", "polite", "solved"] as const;

function clock(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function useDates() {
  const { t } = useTranslation("help");
  const helpDate = useHelpDate();
  return useMemo(() => {
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const short = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86_400_000);
      if (sameDay(date, now)) return clock(value);
      if (sameDay(date, yesterday)) return `${t("tickets.yesterday")}, ${clock(value)}`;
      return helpDate(value);
    };
    const day = (value: string) => {
      const date = new Date(value);
      const now = new Date();
      if (sameDay(date, now)) return t("tickets.today");
      if (sameDay(date, new Date(now.getTime() - 86_400_000))) return t("tickets.yesterday");
      return helpDate(value);
    };
    const month = (date: Date) => helpDate(date.toISOString(), "month");
    return { short, day, month };
  }, [helpDate, t]);
}

function TicketRows({ tickets, selected, onOpen }: { tickets: SupportTicket[]; selected: string | null; onOpen: (id: string) => void }) {
  const { t } = useTranslation("help");
  const dates = useDates();
  const groups = groupTickets(tickets, new Date(), dates.month, t("tickets.thisWeek"));
  const isCompact = useIsCompact();
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <p className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">{group.label}</p>
          <div className={`flex flex-col ${isCompact ? "overflow-hidden rounded-xl bg-surface" : "gap-1"}`}>
            {group.items.map((ticket) => {
              const topic = ticketTopic(ticket.category);
              const active = selected === ticket.id;
              const unread = ticketUnread(ticket) && !active;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    isCompact ? "border-b border-line last:border-b-0 hover:bg-subtle" : `rounded-xl ${active ? "bg-brand-subtle" : "hover:bg-subtle"}`
                  }`}
                  onClick={() => onOpen(ticket.id)}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-md ${topic?.tone ?? "bg-brand-subtle text-brand"}`}>
                    <Icon name={topic?.icon ?? "forum"} size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <strong className="truncate text-title-sm font-semibold text-ink">{ticket.subject}</strong>
                      {unread ? <i className="ml-auto size-2 shrink-0 rounded-full bg-brand not-italic" aria-hidden="true" /> : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-caption text-ink-secondary">
                      <StatusChip status={ticket.status} />
                      {[ticketLabel(ticket), dates.short(ticket.updatedAt)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={18} className="shrink-0 text-icon-secondary" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function FilterTabs({ value, onChange }: { value: TicketFilter; onChange: (value: TicketFilter) => void }) {
  const { t } = useTranslation("help");
  const isCompact = useIsCompact();
  return (
    <div className={`flex gap-1 ${isCompact ? "rounded-full bg-surface p-1" : "flex-wrap gap-2"}`} role="tablist">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          className={`flex h-10 items-center justify-center rounded-full px-3.5 text-body-sm font-medium whitespace-nowrap transition-colors ${
            isCompact ? "min-w-0 flex-1" : "border"
          } ${
            value === filter
              ? "border-brand bg-brand text-on-action"
              : isCompact
                ? "text-ink hover:bg-subtle"
                : "border-line bg-surface text-ink hover:bg-subtle"
          }`}
          onClick={() => onChange(filter)}
        >
          {t(`tickets.filters.${filter}`)}
        </button>
      ))}
    </div>
  );
}

function ListEmpty({ filter }: { filter: TicketFilter }) {
  const { t } = useTranslation("help");
  const minutes = useReplyMinutes();
  const { openNewTicket } = useHelpActions();
  if (filter === "all")
    return (
      <EmptyBlock
        icon="forum"
        title={t("tickets.emptyTitle")}
        text={t("tickets.emptyText", { minutes })}
        action={{ label: t("home.send"), icon: "add", onClick: () => openNewTicket() }}
      />
    );
  const key = filter === "open" ? "Open" : filter === "answered" ? "Answered" : "Closed";
  return <EmptyBlock plain icon={filter === "open" ? "check-circle" : "forum"} title={t(`tickets.empty${key}Title`)} text={t(`tickets.empty${key}Text`)} />;
}

async function openAttachment(file: SupportAttachment) {
  const blob = await apiClient.get<Blob>(file.url, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function RatingDialog({ ticket, open, onOpenChange }: { ticket: SupportTicket; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("help");
  const isCompact = useIsCompact();
  const rate = useRateSupportTicket(ticket.id);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const labels = t("rating.labels", { returnObjects: true }) as string[];
  const name = staffName(ticket);

  function submit() {
    rate.mutate(
      { stars, tags, comment: comment.trim() },
      {
        onSuccess: () => {
          toast.success(t("rating.sent"));
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:max-w-120"
      title={t("rating.title")}
      description={name ? t("rating.subtitle", { name }) : t("rating.subtitleNoName")}
      footer={
        isCompact ? (
          <button type="button" className={`${dialogButton.primary} w-full`} disabled={!stars || rate.isPending} onClick={submit}>
            {t("rating.submit")}
          </button>
        ) : (
          <>
            <button type="button" className="h-11 px-4 text-button text-brand" onClick={() => onOpenChange(false)}>
              {t("rating.skip")}
            </button>
            <button type="button" className={`${dialogButton.primary} flex-none`} disabled={!stars || rate.isPending} onClick={submit}>
              {t("rating.submit")}
            </button>
          </>
        )
      }
    >
      <div className="flex flex-col items-center gap-4 pb-1">
        <div className="flex gap-3" role="radiogroup" aria-label={t("rating.title")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={stars === value}
              aria-label={t("rating.star", { count: value })}
              className={value <= stars ? "text-warning" : "text-line-strong"}
              onClick={() => setStars(value)}
            >
              <Icon name={value <= stars ? "star" : "star-outline"} size={32} />
            </button>
          ))}
        </div>
        {stars ? <strong className="text-title text-ink">{labels[stars - 1]}</strong> : null}
        <div className="flex flex-wrap justify-center gap-2">
          {RATING_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                className={`flex h-11 items-center rounded-full border px-4 text-body-sm transition-colors ${
                  on ? "border-brand bg-brand text-on-action" : "border-line bg-surface text-ink hover:bg-subtle"
                }`}
                onClick={() => setTags((current) => (on ? current.filter((item) => item !== tag) : [...current, tag]))}
              >
                {t(`rating.tags.${tag}`)}
              </button>
            );
          })}
        </div>
        <label className="flex w-full flex-col gap-2">
          <span className="text-body-sm font-medium text-ink">{t("rating.comment")}</span>
          <textarea
            className="min-h-28 resize-none rounded-lg bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-focus"
            value={comment}
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("rating.commentPlaceholder")}
          />
        </label>
      </div>
    </AppDialog>
  );
}

interface PendingMessage {
  id: string;
  body: string;
  failed: boolean;
}

function Thread({ ticketId, onClose }: { ticketId: string; onClose?: () => void }) {
  const { t } = useTranslation("help");
  const isCompact = useIsCompact();
  const online = useOnline();
  const dates = useDates();
  const config = useHelpConfig();
  const ticket = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId);
  const close = useCloseSupportTicket(ticketId);
  const { openNewTicket } = useHelpActions();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [rating, setRating] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const data = ticket.data;
  const count = (data?.messages.length ?? 0) + pending.length;

  useEffect(() => {
    if (data) markTicketSeen(data);
  }, [data]);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [count, ticketId]);

  if (ticket.isLoading) return <RowsSkeleton rows={3} />;
  if (!data) return <EmptyBlock plain icon="forum" title={ticket.isError ? t("tickets.loadError") : t("tickets.notFound")} />;

  const topic = ticketTopic(data.category);
  const closed = data.status === "closed";
  const askSolved = data.status === "answered" && data.messages.at(-1)?.fromStaff;
  const firstStaff = data.messages.findIndex((message) => message.fromStaff);
  const label = ticketLabel(data);
  const attachEnabled = Boolean(config.data?.attachmentsMaxMb);

  function send(body: string, retryId?: string) {
    if (!body.trim() && !files.length) return;
    sequence.current += 1;
    const id = retryId ?? `local-${sequence.current}`;
    setPending((current) => [...current.filter((item) => item.id !== id), { id, body, failed: false }]);
    const sending = files;
    setText("");
    setFiles([]);
    reply.mutate(
      { message: body, files: sending },
      {
        onSuccess: () => setPending((current) => current.filter((item) => item.id !== id)),
        onError: () => setPending((current) => current.map((item) => (item.id === id ? { ...item, failed: true } : item))),
      }
    );
  }

  function closeTicket() {
    close.mutate(undefined, {
      onSuccess: (next) => {
        setConfirm(false);
        if (next.rateable) setRating(true);
        else toast.success(t("tickets.closedToast"));
      },
      onError: (error) => toast.error(error.message),
    });
  }

  const header = (
    <div className={`flex items-center gap-3 ${isCompact ? "rounded-xl bg-surface px-4 py-3" : "border-b border-line px-5 py-4"}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${topic?.tone ?? "bg-brand-subtle text-brand"}`}>
        <Icon name={topic?.icon ?? "forum"} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title font-semibold text-ink">{data.subject}</strong>
        <small className="truncate text-caption text-ink-secondary">
          {[isCompact ? "" : label, topic ? t(`topics.${topic.id}.title`) : "", t("tickets.openedAt", { time: dates.short(data.createdAt) })]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </span>
      <StatusChip status={data.status} />
      {!isCompact && !closed ? (
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-4 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
          onClick={() => setConfirm(true)}
        >
          <Icon name="lock" size={16} />
          {t("tickets.close")}
        </button>
      ) : null}
    </div>
  );

  const bubbles = (
    <div className="flex flex-col gap-3">
      <span className="self-center rounded-full bg-surface px-3 py-1 text-caption-strong text-ink-secondary">{dates.day(data.createdAt)}</span>
      <span className="flex items-center gap-1.5 self-center rounded-full px-3 py-1 text-caption text-ink-secondary">
        <Icon name="check-circle" size={14} />
        {label ? t("tickets.created", { number: label }) : t("tickets.createdNoNumber")}
      </span>
      {data.messages.map((message, index) => (
        <div key={message.id} className="flex flex-col gap-3">
          {index === firstStaff && message.author ? (
            <span className="flex items-center gap-1.5 self-center text-caption text-ink-secondary">
              <Icon name="verified" size={14} />
              {t("tickets.joined", { name: message.author.split(" ")[0] })}
            </span>
          ) : null}
          <div
            className={`flex max-w-[78%] flex-col gap-1 rounded-2xl px-4 py-3 ${
              message.fromStaff ? "self-start bg-surface text-ink" : "self-end bg-brand text-on-action"
            }`}
          >
            {message.fromStaff ? (
              <small className="text-caption-strong text-accent-violet-fg">
                {[message.author.split(" ")[0], t("tickets.staff")].filter(Boolean).join(" · ")}
              </small>
            ) : null}
            {message.body ? <p className="text-body whitespace-pre-line">{message.body}</p> : null}
            {message.attachments.map((file) => (
              <button
                key={file.id}
                type="button"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm ${message.fromStaff ? "bg-subtle" : "bg-white/15"}`}
                onClick={() => void openAttachment(file).catch(() => toast.error(t("tickets.loadError")))}
              >
                <Icon name={file.mime.startsWith("image/") ? "image" : "description"} size={18} />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
            <small className={`flex items-center gap-1 self-end text-caption ${message.fromStaff ? "text-ink-tertiary" : "text-white/80"}`}>
              {clock(message.createdAt)}
              {message.fromStaff ? null : <Icon name="done-all" size={14} />}
            </small>
          </div>
        </div>
      ))}
      {pending.map((message) => (
        <div key={message.id} className="flex flex-col items-end gap-2">
          <div className={`flex max-w-[78%] flex-col gap-1 rounded-2xl bg-brand px-4 py-3 text-on-action ${message.failed ? "" : "opacity-70"}`}>
            <p className="text-body whitespace-pre-line">{message.body}</p>
            <small className="flex items-center gap-1 self-end text-caption text-white/80">
              {message.failed ? <Icon name="warning" size={14} className="text-danger-bg" /> : <Icon name="schedule" size={14} />}
            </small>
          </div>
          {message.failed ? (
            <button type="button" className="flex items-center gap-1.5 self-center rounded-full bg-surface px-3 py-1 text-caption text-ink-secondary" onClick={() => send(message.body, message.id)}>
              <Icon name="warning" size={14} />
              {t("tickets.sendFailed")}
            </button>
          ) : null}
        </div>
      ))}
      {data.status === "open" && data.queuePosition ? (
        <span className="flex items-center gap-2 self-start rounded-full bg-accent-teal-bg px-3 py-1.5 text-caption text-accent-teal-fg">
          <Icon name="schedule" size={14} />
          {t("tickets.queue", { position: data.queuePosition, minutes: data.queueMinutes ?? 10 })}
        </span>
      ) : null}
      {closed ? (
        <span className="flex items-center gap-1.5 self-center rounded-full bg-surface px-3 py-1 text-caption text-ink-secondary">
          <Icon name="lock" size={14} />
          {data.rating ? t("tickets.closedRated", { stars: data.rating.stars }) : t("tickets.closedEvent")}
        </span>
      ) : null}
    </div>
  );

  const solved = askSolved ? (
    <div className={`flex gap-3 rounded-xl bg-surface px-4 py-3 ${isCompact ? "flex-col" : "items-center justify-between"}`}>
      <strong className="text-title-sm font-semibold text-ink">{t("tickets.solved")}</strong>
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex h-11 items-center justify-center rounded-full border border-line-strong px-4 text-body-sm font-semibold whitespace-nowrap text-ink transition-colors hover:bg-subtle ${isCompact ? "min-w-0 flex-1" : ""}`}
          onClick={() => document.getElementById(`composer-${ticketId}`)?.focus()}
        >
          {t("tickets.solvedNo")}
        </button>
        <button
          type="button"
          className={`flex h-11 items-center justify-center rounded-full bg-brand px-4 text-body-sm font-semibold whitespace-nowrap text-on-action transition-colors hover:bg-brand-strong ${isCompact ? "min-w-0 flex-1" : ""}`}
          onClick={() => setConfirm(true)}
        >
          {t("tickets.solvedYes")}
        </button>
      </div>
    </div>
  ) : null;

  const composer = closed ? (
    <div className={`flex items-center gap-3 ${isCompact ? "flex-col" : "justify-between"} border-t border-line px-5 py-4`}>
      <p className="text-body-sm text-ink-secondary">{t("tickets.closedNote")}</p>
      <button
        type="button"
        className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line-strong px-5 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle ${isCompact ? "w-full" : ""}`}
        onClick={() => openNewTicket(data.category ? { category: data.category } : undefined)}
      >
        <Icon name="add" size={18} />
        {t("tickets.new")}
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
      {!online ? (
        <p className="flex items-center gap-1.5 text-caption text-warning-text">
          <Icon name="wifi" size={14} />
          {t("tickets.offlineNote")}
        </p>
      ) : null}
      {files.length ? (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <span key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1 text-caption text-ink">
              {file.name}
              <button type="button" aria-label={t("ticket.removeFile")} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (online) send(text.trim());
        }}
      >
        {attachEnabled ? (
          <>
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,application/pdf"
              onChange={(event) => {
                if (event.target.files) setFiles((current) => [...current, ...(event.target.files ? [...event.target.files] : [])]);
                event.target.value = "";
              }}
            />
            <button type="button" className={mobileRoundButton} aria-label={t("tickets.attach")} onClick={() => fileInput.current?.click()}>
              <Icon name="add" size={22} />
            </button>
          </>
        ) : null}
        <input
          id={`composer-${ticketId}`}
          className="h-11 min-w-0 flex-1 rounded-full bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-focus"
          value={text}
          maxLength={4000}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("tickets.composer")}
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-action transition-colors hover:bg-brand-strong disabled:opacity-40"
          disabled={!online || (!text.trim() && !files.length)}
          aria-label={t("tickets.send")}
        >
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="brand"
        icon="check-circle"
        alert
        title={t("tickets.confirmTitle")}
        description={t("tickets.confirmText")}
        confirmLabel={t("tickets.confirmYes")}
        cancelLabel={t("tickets.confirmNo")}
        pending={close.isPending}
        onConfirm={closeTicket}
      />
      <RatingDialog ticket={data} open={rating} onOpenChange={setRating} />
    </>
  );

  if (isCompact)
    return (
      <MobileHelpScreen
        title={label ? t("tickets.threadTitle", { number: label }) : t("tickets.title")}
        onBack={onClose}
        action={
          closed ? undefined : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={mobileRoundButton} aria-label={t("tickets.menu")}>
                  <Icon name="more" size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setConfirm(true)}>{t("tickets.close")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
        footer={<div className="-mx-4 -mb-4 bg-surface">{composer}</div>}
      >
        {header}
        {bubbles}
        {solved}
        {dialogs}
      </MobileHelpScreen>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-canvas/60 px-5 py-5">
        <div className="mt-auto" />
        {bubbles}
        {solved}
      </div>
      {composer}
      {dialogs}
    </div>
  );
}

export function HelpTicketsPage() {
  const { t } = useTranslation("help");
  const { ticketId = null } = useParams();
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const isCompact = useIsCompact();
  const tickets = useSupportTickets();
  const { openNewTicket } = useHelpActions();
  const [filter, setFilter] = useState<TicketFilter>("all");
  const items = filterTickets(tickets.data ?? [], filter);
  const firstQueued = (tickets.data ?? []).find((ticket) => ticket.status === "open" && ticket.queuePosition);

  const newButton = (
    <button type="button" className={`${mobileButton.primary} w-full flex-none`} onClick={() => openNewTicket()}>
      <Icon name="add" size={20} />
      {t("tickets.new")}
    </button>
  );

  const list = tickets.isLoading ? (
    <RowsSkeleton rows={4} />
  ) : items.length ? (
    <>
      <TicketRows tickets={items} selected={ticketId} onOpen={(id) => navigate(paths.ticket(id))} />
      {filter === "open" && firstQueued?.queuePosition ? (
        <p className="flex items-center gap-1.5 px-1 text-caption text-ink-secondary">
          <Icon name="schedule" size={14} />
          {t("tickets.queueShort", { position: firstQueued.queuePosition, minutes: firstQueued.queueMinutes ?? 10 })}
        </p>
      ) : null}
      {filter === "closed" ? <p className="px-1 text-caption text-ink-tertiary">{t("tickets.archiveNote")}</p> : null}
    </>
  ) : (
    <ListEmpty filter={filter} />
  );

  if (isCompact) {
    if (ticketId) return <Thread ticketId={ticketId} onClose={() => navigate(paths.tickets)} />;
    return (
      <MobileHelpScreen title={t("tickets.title")} onBack={() => navigate(paths.home)} footer={newButton}>
        <FilterTabs value={filter} onChange={setFilter} />
        {list}
      </MobileHelpScreen>
    );
  }

  return (
    <WorkspaceShell
      eyebrow={t("tickets.back")}
      title={t("tickets.title")}
      backTo={paths.home}
    >
      {!tickets.isLoading && !(tickets.data ?? []).length ? (
        <ListEmpty filter="all" />
      ) : (
        <div className="grid h-[calc(100dvh-170px)] min-h-[520px] gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-4 rounded-2xl bg-surface p-4">
            <FilterTabs value={filter} onChange={setFilter} />
            <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
            {newButton}
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-surface">
            {ticketId ? (
              <Thread key={ticketId} ticketId={ticketId} />
            ) : (
              <div className="grid flex-1 place-items-center">
                <EmptyBlock plain icon="forum" title={t("tickets.selectTitle")} text={t("tickets.selectText")} />
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

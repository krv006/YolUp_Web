import { useMemo, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  deviceInfo,
  fileProblem,
  formatSize,
  MIN_DESCRIPTION,
  searchEntries,
  ticketLabel,
  ticketTopic,
  TICKET_TOPICS,
  useCreateTicketDraft,
  useHelpConfig,
  type SupportTicket,
} from "@/modules/support";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { mobileButton } from "@/shared/ui/mobile-page";
import type { NewTicketPrefill } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { StatusChip } from "./help-ui";
import { useHelpPaths, useHelpSearchEntries, useReplyMinutes } from "./use-help";

const FIELD = "w-full rounded-lg bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-focus";

interface PickedFile {
  id: string;
  file: File;
  problem: "size" | "type" | null;
}

function TopicSheet({
  open,
  value,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  value: string;
  onOpenChange: (open: boolean) => void;
  onPick: (value: string) => void;
}) {
  const { t } = useTranslation("help");
  const [current, setCurrent] = useState(value || TICKET_TOPICS[0].id);
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      title={t("ticket.topicSheetTitle")}
      description={t("ticket.topicSheetHint")}
      footer={
        <button
          type="button"
          className={`${dialogButton.primary} w-full`}
          onClick={() => {
            onPick(current);
            onOpenChange(false);
          }}
        >
          {t("ticket.choose")}
        </button>
      }
    >
      <div className="flex flex-col" role="radiogroup">
        {TICKET_TOPICS.map((topic) => (
          <label key={topic.id} className="flex cursor-pointer items-center gap-3 py-2.5">
            <span className={`grid size-10 shrink-0 place-items-center rounded-md ${topic.tone}`}>
              <Icon name={topic.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-title-sm font-semibold text-ink">{t(`topics.${topic.id}.title`)}</strong>
              <small className="text-caption text-ink-secondary">{t(`topics.${topic.id}.hint`)}</small>
            </span>
            <input
              type="radio"
              name="ticket-topic"
              className="size-5 accent-brand"
              checked={current === topic.id}
              onChange={() => setCurrent(topic.id)}
            />
          </label>
        ))}
      </div>
    </AppDialog>
  );
}

function FileChip({ item, progress, onRemove }: { item: PickedFile; progress: number | null; onRemove: () => void }) {
  const { t } = useTranslation("help");
  const config = useHelpConfig();
  const maxMb = config.data?.attachmentsMaxMb ?? 0;
  const image = item.file.type.startsWith("image/");
  const meta = item.problem
    ? item.problem === "size"
      ? t("ticket.tooBig", { size: formatSize(item.file.size), mb: maxMb })
      : t("ticket.badType")
    : progress !== null
      ? t("ticket.uploading", { percent: progress })
      : formatSize(item.file.size);
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 ${item.problem ? "border border-danger bg-danger-bg" : "bg-subtle"}`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-md ${item.problem ? "text-error-text" : "bg-brand-subtle text-brand"}`}>
        <Icon name={item.file.type.startsWith("video/") ? "videocam-fill" : image ? "image" : "description"} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-body-sm font-semibold text-ink">{item.file.name}</strong>
        <small className={`text-caption ${item.problem ? "text-error-text" : "text-ink-secondary"}`}>{meta}</small>
        {progress !== null && !item.problem ? (
          <span className="mt-1.5 block h-1 w-37.5 max-w-full overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-brand transition-[width]" style={{ width: `${Math.max(progress, 3)}%` }} />
          </span>
        ) : null}
      </span>
      <button
        type="button"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:text-ink"
        aria-label={t("ticket.removeFile")}
        onClick={onRemove}
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

interface FormProps {
  prefill: NewTicketPrefill;
  onCreated: (ticket: SupportTicket) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onOpenArticle: (id: string) => void;
}

function useTicketForm({ prefill, onCreated }: Pick<FormProps, "prefill" | "onCreated">) {
  const { t } = useTranslation("help");
  const config = useHelpConfig();
  const maxMb = config.data?.attachmentsMaxMb ?? 0;
  const maxFiles = config.data?.attachmentsMaxFiles ?? 5;
  const initialTopic = TICKET_TOPICS.some((topic) => topic.id === prefill.category) ? (prefill.category as string) : "";
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [withDevice, setWithDevice] = useState(true);
  const [tried, setTried] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const create = useCreateTicketDraft((fraction) => setProgress(Math.min(99, Math.round(fraction * 100))));
  const entries = useHelpSearchEntries();
  const suggestion = useMemo(() => {
    const query = subject.trim().split(" ").filter((word) => word.length > 3).slice(0, 2).join(" ");
    if (query.length < 4) return null;
    return searchEntries(entries.filter((entry) => entry.kind === "article"), query)[0] ?? null;
  }, [entries, subject]);

  const short = message.trim().length < MIN_DESCRIPTION;
  const badFiles = files.some((item) => item.problem);
  const ready = Boolean(topic && subject.trim() && !create.isPending);
  const dirty = Boolean(subject.trim() || message.trim() || files.length);

  function addFiles(list: FileList | File[]) {
    const next = [...list].slice(0, Math.max(0, maxFiles - files.length)).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      problem: fileProblem(file, maxMb),
    }));
    setFiles((current) => [...current, ...next]);
  }

  function submit() {
    setTried(true);
    if (!ready || short || badFiles) return;
    setProgress(files.length ? 0 : null);
    create.mutate(
      {
        category: topic,
        subject: subject.trim(),
        message: message.trim(),
        deviceInfo: withDevice ? deviceInfo() : null,
        files: files.map((item) => item.file),
      },
      {
        onSuccess: onCreated,
        onError: (error) => {
          setProgress(null);
          toast.error(error instanceof Error && error.message ? error.message : t("ticket.failed"));
        },
      }
    );
  }

  return {
    topic, setTopic, subject, setSubject, message, setMessage, files, setFiles, withDevice, setWithDevice,
    tried, progress, create, suggestion, short, ready, dirty, addFiles, submit, maxMb, maxFiles,
  };
}

function TicketFields({ form, onOpenArticle, compact }: { form: ReturnType<typeof useTicketForm>; onOpenArticle: (id: string) => void; compact: boolean }) {
  const { t } = useTranslation("help");
  const [sheet, setSheet] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const topic = ticketTopic(form.topic);
  const showShort = form.tried && form.short;

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) form.addFiles(event.dataTransfer.files);
  }

  const suggestion = form.suggestion ? (
    <button
      type="button"
      className="flex items-center gap-3 rounded-lg bg-brand-subtle px-4 py-3 text-left transition-opacity hover:opacity-90"
      onClick={() => onOpenArticle(form.suggestion!.id)}
    >
      <Icon name="menu-book" size={20} className="shrink-0 text-brand" />
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="text-caption text-ink-secondary">{t("ticket.suggest")}</small>
        <strong className="truncate text-body-sm font-semibold text-ink">{form.suggestion.title}</strong>
      </span>
      <Icon name="chevron-right" size={18} className="shrink-0 text-icon-secondary" />
    </button>
  ) : null;

  const topicField = compact ? (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm font-medium text-ink">{t("ticket.topic")}</span>
      <button
        type="button"
        className={`flex h-13 items-center justify-between rounded-lg bg-subtle px-4 text-left text-body ${topic ? "text-ink" : "text-ink-tertiary"}`}
        onClick={() => setSheet(true)}
      >
        {topic ? t(`topics.${topic.id}.title`) : t("ticket.topicPlaceholder")}
        <Icon name="expand-more" size={20} className="text-icon-secondary" />
      </button>
    </div>
  ) : (
    <SelectPicker
      label={t("ticket.topic")}
      value={form.topic}
      onChange={form.setTopic}
      options={TICKET_TOPICS.map((item) => ({ value: item.id, label: t(`topics.${item.id}.title`) }))}
    />
  );

  const subjectField = (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm font-medium text-ink">{t("ticket.subject")}</span>
      <input
        className={`${FIELD} h-13`}
        value={form.subject}
        maxLength={200}
        onChange={(event) => form.setSubject(event.target.value)}
        placeholder={t("ticket.subjectPlaceholder")}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      {suggestion}
      {compact ? (
        <>
          {topicField}
          {subjectField}
        </>
      ) : (
        <div className="grid grid-cols-2 items-end gap-4">
          {topicField}
          {subjectField}
        </div>
      )}
      <label className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-ink">{t("ticket.description")}</span>
        <textarea
          className={`${FIELD} min-h-28 resize-none py-3 ${showShort ? "ring-2 ring-danger focus:ring-danger" : ""}`}
          value={form.message}
          maxLength={4000}
          onChange={(event) => form.setMessage(event.target.value)}
          placeholder={t("ticket.descriptionPlaceholder")}
        />
        <small className={`text-caption ${showShort ? "text-error-text" : "text-ink-tertiary"}`}>
          {showShort
            ? t("ticket.descriptionShort", { min: MIN_DESCRIPTION, count: form.message.trim().length })
            : t("ticket.descriptionHint", { min: MIN_DESCRIPTION })}
        </small>
      </label>

      {form.maxMb ? (
        <div className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-ink">{t("ticket.files")}</span>
          <input
            ref={input}
            type="file"
            hidden
            multiple
            accept="image/png,image/jpeg,application/pdf"
            onChange={(event) => {
              if (event.target.files) form.addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          {form.files.length ? (
            <>
              <div className={`grid gap-3 ${compact || form.files.length === 1 ? "" : "grid-cols-2"}`}>
                {form.files.map((item) => (
                  <FileChip
                    key={item.id}
                    item={item}
                    progress={form.create.isPending ? form.progress : null}
                    onRemove={() => form.setFiles((current) => current.filter((entry) => entry.id !== item.id))}
                  />
                ))}
              </div>
              {form.files.length < form.maxFiles && !form.create.isPending ? (
                <button type="button" className="flex items-center gap-1.5 self-start text-body-xs text-brand" onClick={() => input.current?.click()}>
                  <Icon name="add" size={16} />
                  {t("ticket.addFile")}
                </button>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className={`flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed px-4 text-body-sm transition-colors ${
                dragging ? "border-brand bg-brand-subtle" : "border-line-strong"
              } ${compact ? "flex-col py-6" : "h-14"}`}
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <Icon name="upload" size={20} className="text-brand" />
              {compact ? (
                <>
                  <strong className="text-body-sm font-semibold text-brand">{t("ticket.attach")}</strong>
                  <small className="text-caption text-ink-tertiary">{t("ticket.filesHint", { mb: form.maxMb })}</small>
                </>
              ) : (
                <span className="text-ink-secondary">
                  {t("ticket.dropFiles")} <span className="font-semibold text-brand">{t("ticket.pickFiles")}</span>
                  <span className="ml-2 text-caption text-ink-tertiary">· {t("ticket.filesHint", { mb: form.maxMb })}</span>
                </span>
              )}
            </button>
          )}
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-3 text-body-sm text-ink-secondary">
        <input
          type="checkbox"
          className="size-5 shrink-0 accent-brand"
          checked={form.withDevice}
          onChange={(event) => form.setWithDevice(event.target.checked)}
        />
        {compact ? t("ticket.deviceInfoMobile") : t("ticket.deviceInfo")}
      </label>

      {compact ? <TopicSheet open={sheet} value={form.topic} onOpenChange={setSheet} onPick={form.setTopic} /> : null}
    </div>
  );
}

function CreatedSummary({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation("help");
  const topic = ticketTopic(ticket.category);
  const rows = [
    ticketLabel(ticket) ? { icon: "description", tone: "bg-brand-subtle text-brand", label: t("ticket.number"), value: <span>{ticketLabel(ticket)}</span> } : null,
    topic ? { icon: topic.icon, tone: topic.tone, label: t("ticket.topic"), value: <span>{t(`topics.${topic.id}.title`)}</span> } : null,
    { icon: "schedule", tone: "bg-brand-subtle text-brand", label: t("ticket.status"), value: <StatusChip status={ticket.status} /> },
  ].filter((row): row is NonNullable<typeof row> => row !== null);
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl bg-subtle">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <span className={`grid size-9 shrink-0 place-items-center rounded-md ${row.tone}`}>
            <Icon name={row.icon} size={18} />
          </span>
          <strong className="min-w-0 flex-1 text-left text-title-sm font-semibold text-ink">{row.label}</strong>
          <span className="text-body-sm text-ink-secondary">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function CreatedBody({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation("help");
  const minutes = useReplyMinutes();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-success-bg text-success-fg">
        <Icon name="check-circle" size={40} />
      </span>
      <h2 className="font-heading text-h2 text-ink">{t("ticket.createdTitle")}</h2>
      <p className="max-w-[420px] text-body text-ink-secondary">{t("ticket.createdText", { minutes })}</p>
      <CreatedSummary ticket={ticket} />
    </div>
  );
}

export function NewTicketDialog({ open, prefill, onOpenChange }: { open: boolean; prefill: NewTicketPrefill; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const config = useHelpConfig();
  const minutes = useReplyMinutes();
  const [created, setCreated] = useState<SupportTicket | null>(null);
  const [session, setSession] = useState(0);

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setCreated(null);
      setSession((value) => value + 1);
    }
  }

  if (created)
    return (
      <AppDialog
        open={open}
        onOpenChange={close}
        variant="confirm"
        width="lg:w-115"
        title=""
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => close(false)}>
              {t("ticket.helpCenter")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              onClick={() => {
                const id = created.id;
                close(false);
                navigate(paths.ticket(id));
              }}
            >
              {t("ticket.view")}
            </button>
          </>
        }
      >
        <CreatedBody ticket={created} />
      </AppDialog>
    );

  return (
    <NewTicketDialogForm
      key={session}
      open={open}
      prefill={prefill}
      title={t("ticket.newTitle")}
      description={`${t("ticket.newSubtitle", { minutes })}${config.data?.hours ? t("ticket.hours", { hours: config.data.hours }) : ""}`}
      onOpenChange={close}
      onCreated={setCreated}
      onOpenArticle={(id) => {
        close(false);
        navigate(paths.article(id));
      }}
    />
  );
}

function NewTicketDialogForm({
  open,
  prefill,
  title,
  description,
  onOpenChange,
  onCreated,
  onOpenArticle,
}: {
  open: boolean;
  prefill: NewTicketPrefill;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: SupportTicket) => void;
  onOpenArticle: (id: string) => void;
}) {
  const { t } = useTranslation("help");
  const form = useTicketForm({ prefill, onCreated });
  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => !form.create.isPending && onOpenChange(next)}
      variant="adaptive"
      width="lg:max-w-160"
      title={title}
      description={description}
      footer={
        <div className="flex w-full items-center gap-4">
          <span className="min-w-0 flex-1" />
          <button type="button" className="h-11 px-3 text-button text-brand" onClick={() => onOpenChange(false)}>
            {t("ticket.cancel")}
          </button>
          <button type="button" className={`${dialogButton.primary} flex-none`} disabled={!form.ready} onClick={form.submit}>
            {form.create.isPending ? t("ticket.sending") : t("ticket.send")}
          </button>
        </div>
      }
    >
      <TicketFields form={form} onOpenArticle={onOpenArticle} compact={false} />
    </AppDialog>
  );
}

export function NewTicketPage({ prefill }: { prefill: NewTicketPrefill }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const minutes = useReplyMinutes();
  const isCompact = useIsCompact();
  const [created, setCreated] = useState<SupportTicket | null>(null);
  const [discard, setDiscard] = useState(false);
  const form = useTicketForm({ prefill, onCreated: setCreated });

  function back() {
    if (form.dirty && !created) setDiscard(true);
    else navigate(paths.home, { replace: true });
  }

  if (!isCompact) return null;

  if (created)
    return (
      <MobileHelpScreen
        title={t("ticket.createdPage")}
        onBack={() => navigate(paths.home, { replace: true })}
        footer={
          <div className="flex flex-col gap-2">
            <button type="button" className={`${mobileButton.primary} w-full flex-none`} onClick={() => navigate(paths.ticket(created.id), { replace: true })}>
              {t("ticket.view")}
            </button>
            <button type="button" className="h-12 text-title-sm font-semibold text-brand" onClick={() => navigate(paths.home, { replace: true })}>
              {t("ticket.backToHelp")}
            </button>
          </div>
        }
      >
        <div className="pt-6">
          <CreatedBody ticket={created} />
        </div>
      </MobileHelpScreen>
    );

  return (
    <MobileHelpScreen
      title={t("ticket.newTitle")}
      onBack={back}
      footer={
        <button type="button" className={`${mobileButton.primary} w-full`} disabled={!form.ready} onClick={form.submit}>
          {form.create.isPending ? t("ticket.sending") : t("ticket.send")}
        </button>
      }
    >
      <p className="flex items-center gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-body-sm text-brand">
        <Icon name="schedule" size={18} />
        {t("ticket.newSubtitle", { minutes })}
      </p>
      <div className="rounded-xl bg-surface px-4 py-4">
        <TicketFields form={form} onOpenArticle={(id) => navigate(paths.article(id))} compact />
      </div>
      <ConfirmDialog
        open={discard}
        onOpenChange={setDiscard}
        icon="trash"
        title={t("ticket.discardTitle")}
        description={t("ticket.discardText")}
        confirmLabel={t("ticket.discardConfirm")}
        cancelLabel={t("ticket.discardKeep")}
        onConfirm={() => navigate(paths.home, { replace: true })}
      />
    </MobileHelpScreen>
  );
}

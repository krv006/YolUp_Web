import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { conversationApi, conversationKeys } from "@/modules/conversation";
import { useCreateInviteLink, useInviteLink, useSubjects } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Switch } from "@/shared/ui/switch";
import { toDataURL } from "qrcode";

interface GroupDraft {
  name: string;
  subject: string;
  description: string;
  lessonsPerWeek: string;
  fee: string;
}

const INVITE_DAYS = 7;

const MOBILE_FIELD =
  "h-13 w-full rounded-lg border-[1.5px] border-transparent bg-subtle px-4 text-body text-ink outline-none transition-colors placeholder:text-ink-secondary focus:border-focus";

const EMPTY: GroupDraft = { name: "", subject: "", description: "", lessonsPerWeek: "3", fee: "" };

function formatFee(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const { t } = useTranslation("chat");
  const [group, setGroup] = useState<GroupDraft>(EMPTY);
  const [created, setCreated] = useState<Conversation | null>(null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const subjects = useSubjects(open);
  const isCompact = useIsCompact();
  const create = useMutation({
    mutationFn: conversationApi.createGroup.bind(conversationApi),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      setGroup(EMPTY);
      setCreated(room);
      if (!isCompact) toast.success(t("newDialog.createdToast"));
    },
  });

  function finish() {
    const room = created;
    setCreated(null);
    onOpenChange(false);
    if (room) navigate(`/teacher/chats/${room.id}`);
  }

  if (created) {
    return (
      <GroupReadyDialog
        room={created}
        open={open}
        onOpenChange={(next) => {
          if (!next) finish();
        }}
      />
    );
  }

  function update(field: keyof GroupDraft, value: string) {
    setGroup((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group.name.trim() || !group.subject.trim()) return;
    const fee = Number(group.fee.replace(/\s/g, ""));
    create.mutate({
      name: group.name,
      subject: group.subject,
      description: group.description,
      lessonsPerWeek: group.lessonsPerWeek ? Number(group.lessonsPerWeek) : null,
      monthlyFee: Number.isFinite(fee) && fee > 0 ? fee : null,
    });
  }

  const lessons = Number(group.lessonsPerWeek) || 1;

  if (isCompact)
    return (
      <AppDialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) setGroup(EMPTY);
        }}
        title={t("newDialog.title")}
        description={t("newDialog.mobileSubtitle")}
        titleClassName="text-h2 leading-6 font-semibold"
        closeClassName="size-11"
        footerClassName="items-center px-4 pt-6 pb-[max(30px,env(safe-area-inset-bottom))]"
        footer={
          <>
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong`}
              onClick={() => onOpenChange(false)}
            >
              {t("newDialog.cancel")}
            </button>
            <button
              type="submit"
              form="new-group-form"
              className={`${dialogButton.primary} h-13`}
              disabled={!group.name.trim() || !group.subject.trim() || create.isPending}
            >
              {t("newDialog.create")}
            </button>
          </>
        }
      >
        <form id="new-group-form" className="-mt-1 flex flex-col gap-4" onSubmit={submit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm text-ink">{t("newDialog.courseNameLabel")}</span>
            <input
              className={MOBILE_FIELD}
              value={group.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder={t("newDialog.courseNamePlaceholder")}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm text-ink">{t("newDialog.subjectLabel")}</span>
            <span className="relative flex">
              <select
                className={`${MOBILE_FIELD} appearance-none pr-11 ${group.subject ? "" : "text-ink-secondary"}`}
                value={group.subject}
                onChange={(event) => update("subject", event.target.value)}
              >
                <option value="" disabled>
                  {t("newDialog.subjectPlaceholder")}
                </option>
                {(subjects.data ?? []).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                size={20}
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-secondary"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm text-ink">{t("newDialog.shortDescriptionLabel")}</span>
            <textarea
              className={`${MOBILE_FIELD} h-28 resize-none py-3.5`}
              value={group.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder={t("newDialog.descriptionPlaceholder")}
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-body-sm font-medium text-ink">{t("newDialog.lessonsPerWeekLabel")}</strong>
              <small className="text-caption text-ink-secondary">{t("newDialog.lessonsHint")}</small>
            </span>
            <span className="flex h-13 shrink-0 items-center rounded-full border-4 border-subtle bg-surface">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-surface text-ink shadow-xs disabled:opacity-40"
                aria-label={t("newDialog.decrease")}
                disabled={lessons <= 1}
                onClick={() => update("lessonsPerWeek", String(Math.max(1, lessons - 1)))}
              >
                <Icon name="remove" size={20} />
              </button>
              <span className="w-16 text-center text-title-sm text-ink">
                {t("newDialog.lessonsPerWeekValue", { count: lessons })}
              </span>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-surface text-ink shadow-xs disabled:opacity-40"
                aria-label={t("newDialog.increase")}
                disabled={lessons >= 7}
                onClick={() => update("lessonsPerWeek", String(Math.min(7, lessons + 1)))}
              >
                <Icon name="add" size={20} />
              </button>
            </span>
          </div>

          {create.isError ? (
            <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              {create.error.message}
            </p>
          ) : null}
        </form>
      </AppDialog>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setGroup(EMPTY);
      }}
      width="lg:w-140"
      icon={
        <span className="grid size-11 place-items-center rounded-md bg-brand-subtle text-brand">
          <Icon name="groups" size={22} />
        </span>
      }
      title={t("newDialog.title")}
      description={t("newDialog.noteDescription")}
      footer={
        <>
          <p className="min-w-0 flex-1 text-body-xs text-ink-tertiary">{t("newDialog.footerHint")}</p>
          <button
            type="button"
            className="flex h-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => onOpenChange(false)}
          >
            {t("newDialog.cancel")}
          </button>
          <button
            type="submit"
            form="new-group-form"
            className="flex h-12 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={!group.name.trim() || !group.subject.trim() || create.isPending}
          >
            {t("newDialog.create")}
          </button>
        </>
      }
    >
      <form id="new-group-form" className="flex flex-col gap-4" onSubmit={submit}>
        <div className="flex items-start gap-4">
          <span className="grid size-24 shrink-0 place-items-center rounded-md bg-subtle text-icon-tertiary">
            <Icon name="photo-camera" size={24} />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <label className="field-group">
              <span>{t("newDialog.courseNameLabel")}</span>
              <input
                autoFocus
                value={group.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder={t("newDialog.courseNamePlaceholder")}
              />
              <small className="px-1 text-body-xs text-ink-tertiary">
                {t("newDialog.courseNameHint")}
              </small>
            </label>

            <SelectPicker
              label={t("newDialog.subjectLabel")}
              searchable
              value={group.subject}
              onChange={(value) => update("subject", value)}
              options={(subjects.data ?? []).map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </div>
        </div>

        <label className="field-group">
          <span>{t("newDialog.descriptionLabel")}</span>
          <input
            value={group.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder={t("newDialog.descriptionPlaceholder")}
          />
        </label>

        <div className="grid items-start gap-3 sm:grid-cols-2">
          <SelectPicker
            label={t("newDialog.lessonsPerWeekLabel")}
            value={group.lessonsPerWeek}
            onChange={(value) => update("lessonsPerWeek", value)}
            options={[1, 2, 3, 4, 5, 6, 7].map((count) => ({
              value: String(count),
              label: t("newDialog.lessonsPerWeekValue", { count }),
            }))}
          />
          <label className="field-group">
            <span>{t("newDialog.feeLabel")}</span>
            <input
              value={group.fee}
              onChange={(event) => update("fee", formatFee(event.target.value))}
              placeholder={t("newDialog.feePlaceholder")}
              inputMode="numeric"
            />
          </label>
        </div>

        {create.isError ? (
          <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
            {create.error.message}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}

function GroupReadyDialog({
  room,
  open,
  onOpenChange,
}: {
  room: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("chat");
  const isCompact = useIsCompact();
  const courseId = room.courseId ?? null;
  const link = useInviteLink(courseId, open);
  const createLink = useCreateInviteLink();
  const [requireApproval, setRequireApproval] = useState(true);
  const [qr, setQr] = useState("");
  const requested = useRef(false);

  const current = link.data ?? null;

  useEffect(() => {
    if (!courseId || link.isLoading || current || requested.current) return;
    requested.current = true;
    createLink.mutate({ courseId, input: { requireApproval, expiresInDays: INVITE_DAYS } });
  }, [courseId, link.isLoading, current, createLink, requireApproval]);

  useEffect(() => {
    if (!current?.url) return;
    let active = true;
    toDataURL(current.url, { margin: 0, width: 160, color: { dark: "#24264d", light: "#ffffff" } })
      .then((value) => {
        if (active) setQr(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [current?.url]);

  function toggleApproval(next: boolean) {
    setRequireApproval(next);
    if (courseId) createLink.mutate({ courseId, input: { requireApproval: next, expiresInDays: INVITE_DAYS } });
  }

  async function copy() {
    if (!current?.url) return;
    try {
      await navigator.clipboard.writeText(current.url);
      toast.success(t("newDialog.inviteCopied"));
    } catch {
      toast.error(t("newDialog.inviteCopyFailed"));
    }
  }

  async function share() {
    if (!current?.url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: room.title, url: current.url });
      } catch {
        return;
      }
      onOpenChange(false);
      return;
    }
    await copy();
    onOpenChange(false);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={isCompact ? "sheet" : "confirm"}
      title={t("newDialog.readyTitle")}
      description={room.title}
      titleClassName={isCompact ? "text-h2 leading-6 font-semibold" : undefined}
      closeClassName={isCompact ? "size-11" : undefined}
      footerClassName={
        isCompact ? "items-center px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]" : undefined
      }
      footer={
        <>
          <button
            type="button"
            className={`${dialogButton.secondary} ${isCompact ? "h-13 border-line-strong" : ""}`}
            onClick={() => onOpenChange(false)}
          >
            {t("newDialog.later")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} ${isCompact ? "h-13" : ""}`}
            disabled={!current?.url}
            onClick={share}
          >
            {t("newDialog.inviteShare")}
          </button>
        </>
      }
    >
      <p
        className={`flex items-center gap-2.5 bg-accent-green-bg px-4 text-body-sm text-success-fg ${
          isCompact ? "-mt-1 h-11 rounded-xl" : "rounded-md py-3"
        }`}
      >
        <Icon name="check-circle" size={18} className="shrink-0" />
        {t("newDialog.createdToast")}
      </p>

      <strong className={isCompact ? "font-heading text-title-lg font-medium text-ink" : "text-title text-ink"}>
        {t("newDialog.inviteTitle")}
      </strong>

      <div className={`flex flex-col gap-3 bg-subtle p-4 ${isCompact ? "rounded-xl" : "rounded-md"}`}>
        <div className="flex items-center gap-3">
          <Icon name="chat" size={18} className="shrink-0 text-brand" />
          <span className={`min-w-0 flex-1 truncate text-ink ${isCompact ? "text-title" : "text-body"}`}>
            {current?.url ?? t("newDialog.invitePending")}
          </span>
          <button
            type="button"
            className={`shrink-0 rounded-full bg-brand-subtle px-3 text-button-sm text-brand transition-colors hover:bg-tint disabled:opacity-50 ${
              isCompact ? "h-9 px-4" : "h-7"
            }`}
            disabled={!current?.url}
            onClick={copy}
          >
            {t("newDialog.inviteCopy")}
          </button>
        </div>

        <div className="flex items-start gap-3">
          <span
            className={`grid shrink-0 place-items-center overflow-hidden bg-surface ${
              isCompact ? "size-22 rounded-xl p-5" : "size-20 rounded-sm p-1.5"
            }`}
          >
            {qr ? (
              <img src={qr} alt="" className="size-full object-contain" />
            ) : (
              <Icon name="qr" size={28} className="text-icon-tertiary" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <small className={`text-ink-secondary ${isCompact ? "text-body-sm" : "text-body-xs"}`}>
              {t("newDialog.inviteDescription", { title: room.title })}
            </small>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption-strong ${
                isCompact ? "bg-accent-teal-bg text-accent-teal-fg" : "bg-warning-bg text-warning-fg"
              }`}
            >
              <Icon name="schedule" size={14} />
              {t("newDialog.inviteExpiry", { count: INVITE_DAYS })}
            </span>
          </span>
        </div>
      </div>

      <span className={`flex items-center gap-3 ${isCompact ? "mt-3.5 mb-3 px-4" : ""}`}>
        <span
          className={`grid shrink-0 place-items-center bg-accent-green-bg text-accent-green-fg ${
            isCompact ? "size-10 rounded-lg" : "size-9 rounded-md"
          }`}
        >
          <Icon name="check-circle" size={isCompact ? 22 : 18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className={`text-ink ${isCompact ? "text-title" : "text-title-sm"}`}>
            {t("newDialog.approvalLabel")}
          </strong>
          <small className={`truncate ${isCompact ? "text-body-sm text-ink-secondary" : "text-body-xs text-ink-tertiary"}`}>
            {t("newDialog.approvalHint")}
          </small>
        </span>
        <Switch
          size={isCompact ? "lg" : "default"}
          checked={requireApproval}
          onCheckedChange={toggleApproval}
          aria-label={t("newDialog.approvalLabel")}
        />
      </span>
    </AppDialog>
  );
}

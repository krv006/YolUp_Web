import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Switch } from "@/shared/ui/switch";
import { useCreateInviteLink, useDeleteInviteLink, useInviteLink } from "../model/course.queries";

export interface InviteLinkDialogProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPIRY_DAYS = ["7", "30", "90", "365"];

export function InviteLinkDialog({ courseId, open, onOpenChange }: InviteLinkDialogProps) {
  const { t } = useTranslation("group");
  const link = useInviteLink(courseId, open);
  const create = useCreateInviteLink();
  const remove = useDeleteInviteLink();
  const [requireApproval, setRequireApproval] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const current = link.data ?? null;
  const pending = create.isPending || remove.isPending;

  const expiryOptions = EXPIRY_DAYS.map((value) => ({
    value,
    label: t("invite.expiresInDays", { count: Number(value) }),
  }));

  function generate() {
    if (!courseId) return;
    create.mutate(
      { courseId, input: { requireApproval, expiresInDays: Number(expiresInDays) } },
      {
        onSuccess: () => {
          setConfirmRefresh(false);
          toast.success(t("invite.created"));
        },
      }
    );
  }

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.url);
      toast.success(t("invite.copied"));
    } catch {
      toast.error(t("invite.copyFailed"));
    }
  }

  async function share() {
    if (!current) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("invite.title"), url: current.url });
        return;
      } catch {
        return;
      }
    }
    await copy();
  }

  const settings = (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("invite.expiryLabel")}</span>
        <SelectPicker
          label={t("invite.expiryLabel")}
          value={expiresInDays}
          onChange={setExpiresInDays}
          options={expiryOptions}
          hideLabel
        />
      </div>

      <span className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-green-bg text-accent-green-fg">
          <Icon name="check-circle" size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-title-sm text-ink">{t("invite.approvalLabel")}</strong>
          <small className="truncate text-body-xs text-ink-tertiary">
            {t("invite.approvalHint")}
          </small>
        </span>
        <Switch
          checked={requireApproval}
          onCheckedChange={setRequireApproval}
          aria-label={t("invite.approvalLabel")}
        />
      </span>
    </>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setConfirmRefresh(false);
      }}
      variant="confirm"
      title={t("invite.title")}
      description={t("invite.description")}
      footer={
        current ? (
          <button type="button" className={dialogButton.primary} onClick={share}>
            {t("invite.share")}
          </button>
        ) : (
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending || !courseId}
            onClick={generate}
          >
            {t("invite.create")}
          </button>
        )
      }
    >
      {link.isLoading ? (
        <div className="h-25 animate-pulse rounded-md bg-muted" />
      ) : current ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("invite.linkLabel")}</span>
            <div className="flex h-12.5 items-center gap-2 rounded-md bg-subtle pr-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate text-body text-ink">{current.url}</span>
              <button
                type="button"
                className="h-9 shrink-0 rounded-full bg-brand px-4 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
                onClick={copy}
              >
                {t("invite.copy")}
              </button>
            </div>
          </div>

          {settings}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={dialogButton.secondary}
              disabled={pending || !courseId}
              onClick={() => (confirmRefresh ? generate() : setConfirmRefresh(true))}
            >
              <Icon name="refresh" size={18} />
              {confirmRefresh ? t("invite.refreshConfirm") : t("invite.refresh")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={pending || !courseId}
              onClick={() =>
                courseId &&
                remove.mutate(courseId, { onSuccess: () => toast.success(t("invite.revoked")) })
              }
            >
              <Icon name="close" size={18} />
              {t("invite.cancelLink")}
            </button>
          </div>

          <p className="text-body-xs text-ink-tertiary">
            {t("invite.refreshWarning")}
            {current.expiresAt
              ? ` · ${t("invite.expiresAt", { value: formatDate(current.expiresAt) })}`
              : ""}
          </p>
        </>
      ) : (
        <>
          <p className="text-body-sm text-ink-secondary">{t("invite.empty")}</p>
          {settings}
        </>
      )}
    </AppDialog>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

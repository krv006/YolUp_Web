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

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setConfirmRefresh(false);
      }}
      title={t("invite.title")}
      description={t("invite.description")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("invite.close")}
          </button>
          {current ? (
            <button
              type="button"
              className={dialogButton.primary}
              disabled={pending}
              onClick={() => (confirmRefresh ? generate() : setConfirmRefresh(true))}
            >
              {confirmRefresh ? t("invite.refreshConfirm") : t("invite.refresh")}
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
          )}
        </>
      }
    >
      {link.isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : current ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-subtle px-4 py-3">
            <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{current.url}</span>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-canvas"
              onClick={copy}
              aria-label={t("invite.copy")}
            >
              <Icon name="assign" size={17} />
            </button>
          </div>

          <p className="px-1 text-caption text-ink-tertiary">
            {current.expiresAt
              ? t("invite.expiresAt", { value: formatDate(current.expiresAt) })
              : t("invite.noExpiry")}
            {current.requireApproval ? ` · ${t("invite.approvalOn")}` : ""}
          </p>

          {confirmRefresh ? (
            <p className="px-1 text-caption text-error-text">{t("invite.refreshWarning")}</p>
          ) : null}

          <button
            type="button"
            className="flex items-center gap-2 px-1 text-label-strong text-error-text disabled:opacity-60"
            disabled={pending || !courseId}
            onClick={() =>
              courseId &&
              remove.mutate(courseId, { onSuccess: () => toast.success(t("invite.revoked")) })
            }
          >
            <Icon name="trash" size={17} /> {t("invite.revoke")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-ink-secondary">{t("invite.empty")}</p>

          <SelectPicker
            label={t("invite.expiryLabel")}
            value={expiresInDays}
            onChange={setExpiresInDays}
            options={expiryOptions}
          />

          <span className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-action text-on-action">
              <Icon name="check-circle" size={17} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="text-label-strong text-ink">{t("invite.approvalLabel")}</strong>
              <small className="text-caption text-ink-tertiary">{t("invite.approvalHint")}</small>
            </span>
            <Switch
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
              aria-label={t("invite.approvalLabel")}
            />
          </span>
        </div>
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

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";

export interface InviteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Comes from the backend once the invite endpoint exists. */
  link?: string | null;
}

export function InviteStudentsDialog({
  open,
  onOpenChange,
  title,
  link = null,
}: InviteStudentsDialogProps) {
  const { t } = useTranslation("chat");

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success(t("newDialog.inviteCopied"));
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title, url: link }).catch(() => undefined);
      return;
    }
    await copy();
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("newDialog.inviteTitle")}
      description={t("newDialog.inviteDescription", { title })}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("newDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!link}
            onClick={share}
          >
            {t("newDialog.inviteShare")}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-xl bg-subtle px-4 py-3">
        <Icon name="eye" size={18} className="shrink-0 text-ink-tertiary" />
        <span
          className={`min-w-0 flex-1 truncate text-body ${link ? "text-ink" : "text-ink-tertiary"}`}
        >
          {link ?? t("newDialog.invitePending")}
        </span>
        <button
          type="button"
          className="shrink-0 text-label-strong text-action disabled:opacity-40"
          disabled={!link}
          onClick={copy}
        >
          {t("newDialog.inviteCopy")}
        </button>
      </div>
    </AppDialog>
  );
}

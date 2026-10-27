import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export interface MediaPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecheck?: () => void;
  onJoinWithout?: () => void;
}

export function MediaPermissionDialog({
  open,
  onOpenChange,
  onRecheck = () => globalThis.location.reload(),
  onJoinWithout,
}: MediaPermissionDialogProps) {
  const { t } = useTranslation("live");
  const isCompact = useIsCompact();

  if (isCompact)
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        tone="brand"
        icon="videocam-fill"
        confirmIcon="refresh"
        title={t("permissionDialog.title")}
        description={t("permissionDialog.description")}
        confirmLabel={t("permissionDialog.recheck")}
        cancelLabel={t("permissionDialog.joinWithout")}
        onConfirm={onRecheck}
        onCancel={onJoinWithout}
      />
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      icon={
        <span className="grid size-9 place-items-center rounded-full bg-error-bg text-error-text">
          <Camera size={18} />
        </span>
      }
      title={t("permissionDialog.title")}
      description={t("permissionDialog.description")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => {
              onOpenChange(false);
              onJoinWithout?.();
            }}
          >
            {t("permissionDialog.joinWithout")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            onClick={onRecheck}
          >
            {t("permissionDialog.recheck")}
          </button>
        </>
      }
    />
  );
}

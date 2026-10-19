import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";

export interface MediaPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaPermissionDialog({ open, onOpenChange }: MediaPermissionDialogProps) {
  const { t } = useTranslation("live");

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
            onClick={() => onOpenChange(false)}
          >
            {t("permissionDialog.joinWithout")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            onClick={() => globalThis.location.reload()}
          >
            {t("permissionDialog.recheck")}
          </button>
        </>
      }
    />
  );
}

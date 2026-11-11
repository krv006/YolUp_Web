import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export interface PaidTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaidTestDialog({ open, onOpenChange }: PaidTestDialogProps) {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="brand"
      icon="lock"
      title={t("paid.title")}
      description={t("paid.description")}
      confirmLabel={t("paid.contact")}
      cancelLabel={t("paid.close")}
      onConfirm={() => {
        onOpenChange(false);
        navigate(`${ROUTES.teacher.profile}/help`);
      }}
    />
  );
}

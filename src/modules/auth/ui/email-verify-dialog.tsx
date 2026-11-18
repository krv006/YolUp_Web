import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog } from "@/shared/ui/app-dialog";
import { EmailVerifyForm } from "./email-verify-form";

export interface EmailVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail: string;
}

export function EmailVerifyDialog({ open, onOpenChange, initialEmail }: EmailVerifyDialogProps) {
  const { t } = useTranslation("auth");
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:max-w-110"
      title={t("emailVerify.title")}
      description={t("emailVerify.description")}
    >
      {open ? (
        <div className="pb-2">
          <EmailVerifyForm
            initialEmail={initialEmail}
            onVerified={() => {
              toast.success(t("emailVerify.done"));
              onOpenChange(false);
            }}
          />
        </div>
      ) : null}
    </AppDialog>
  );
}

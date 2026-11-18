import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { emailSetupOverdue, formatDeadline } from "../lib/email-setup";
import { useAuth } from "../model/use-auth";
import { EmailVerifyForm } from "./email-verify-form";

const LATER_KEY = "fokus_email_setup_later";

function laterChosen(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(LATER_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberLater() {
  try {
    globalThis.sessionStorage?.setItem(LATER_KEY, "1");
  } catch {
    return;
  }
}

export function EmailSetupDialog() {
  const { t } = useTranslation("auth");
  const { user, logout } = useAuth();
  const [later, setLater] = useState(laterChosen);
  const deadline = user?.emailSetupDeadline ?? null;
  const overdue = emailSetupOverdue(deadline);
  const open = Boolean(user?.emailSetupRequired) && !user?.mustChangePassword && (overdue || !later);

  function postpone() {
    rememberLater();
    setLater(true);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !overdue) postpone();
      }}
      variant="confirm"
      width="lg:w-120"
      layout="centered"
      icon={
        <span className="grid size-14 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="mail" size={26} />
        </span>
      }
      title={t("emailSetup.title")}
      description={
        overdue
          ? t("emailSetup.overdue")
          : deadline
            ? t("emailSetup.deadline", { date: formatDeadline(deadline) })
            : t("emailSetup.text")
      }
      footer={
        overdue ? (
          <button type="button" className={`${dialogButton.secondary} w-full flex-none`} onClick={() => void logout()}>
            {t("emailSetup.logout")}
          </button>
        ) : (
          <button type="button" className={`${dialogButton.secondary} w-full flex-none`} onClick={postpone}>
            {t("emailSetup.later")}
          </button>
        )
      }
    >
      {open ? (
        <EmailVerifyForm initialEmail={user?.email ?? ""} onVerified={() => toast.success(t("emailVerify.done"))} />
      ) : null}
    </AppDialog>
  );
}

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

function rememberLater(value: boolean) {
  try {
    if (value) globalThis.sessionStorage?.setItem(LATER_KEY, "1");
    else globalThis.sessionStorage?.removeItem(LATER_KEY);
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
  const required = Boolean(user?.emailSetupRequired) && !user?.mustChangePassword;
  const open = required && (overdue || !later);
  const showBanner = required && !overdue && later;

  function postpone() {
    rememberLater(true);
    setLater(true);
  }

  function reopen() {
    rememberLater(false);
    setLater(false);
  }

  return (
    <>
      {showBanner ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-28 z-30 flex items-center gap-3 rounded-2xl bg-warning-bg py-1.5 pr-1.5 pl-4 lg:rounded-full text-body-sm text-warning-fg shadow-lg ring-1 ring-warning/30 lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2"
        >
          <Icon name="mail" size={18} className="shrink-0" />
          <span className="min-w-0 flex-1 leading-5 lg:truncate">
            {deadline ? t("emailSetup.banner", { date: formatDeadline(deadline) }) : t("emailSetup.bannerNoDate")}
          </span>
          <button
            type="button"
            className="flex h-8 shrink-0 items-center rounded-full bg-surface px-3.5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={reopen}
          >
            {t("emailSetup.bannerAction")}
          </button>
        </div>
      ) : null}
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
    </>
  );
}

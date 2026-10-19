import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth, useLoginHistory } from "@/modules/auth";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";

type DialogId = "password" | "logoutOthers" | "delete" | null;

export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const logins = useLoginHistory(null, true);
  const [dialog, setDialog] = useState<DialogId>(null);

  const sessions = (logins.data ?? []).slice(0, 4);

  return (
    <ProfileSubPage title={t("page.accountTitle")}>
      <SettingsSection label={t("page.loginSection")}>
        <SettingsRow
          icon="person"
          title={user?.phone ?? "—"}
          hint={t("page.phoneLabel")}
          right={
            <span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-success-bg px-2.5 text-caption-strong text-success-text">
              <Icon name="check-circle" size={14} /> {t("page.verified")}
            </span>
          }
        />
        <SettingsRow
          icon="assign"
          title={user?.email ?? "—"}
          hint={t("page.emailLabel")}
          onClick={() => toast.info(t("page.notAvailable"))}
        />
        <SettingsRow
          icon="more"
          title={t("page.changePassword")}
          hint="—"
          onClick={() => setDialog("password")}
        />
      </SettingsSection>

      <SettingsSection label={t("page.securitySection")}>
        <SettingsRow
          icon="check-circle"
          tone="bg-success text-white"
          title={t("page.twoFactor")}
          hint={t("page.twoFactorHint")}
          right={
            <Switch
              checked={false}
              onCheckedChange={() => toast.info(t("page.notAvailable"))}
              aria-label={t("page.twoFactor")}
            />
          }
        />
      </SettingsSection>

      <SettingsSection label={t("page.sessionsSection")}>
        {logins.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : sessions.length ? (
          sessions.map((item, index) => (
            <SettingsRow
              key={item.id ?? index}
              icon="eye"
              tone="bg-ink-tertiary text-white"
              title={item.device || item.userAgent || "—"}
              hint={[item.ip, item.at].filter(Boolean).join(" · ")}
              right={
                index === 0 ? (
                  <span className="flex h-7 shrink-0 items-center rounded-full bg-action-subtle px-2.5 text-caption-strong text-action">
                    {t("page.thisDevice")}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
                    onClick={() => toast.info(t("page.notAvailable"))}
                    aria-label={t("page.logoutOthers")}
                  >
                    <Icon name="arrow-back" size={18} className="rotate-180" />
                  </button>
                )
              }
            />
          ))
        ) : null}
        <SettingsRow
          icon="arrow-back"
          tone="bg-error text-white"
          title={t("page.logoutOthers")}
          danger
          onClick={() => setDialog("logoutOthers")}
          right={<span />}
        />
      </SettingsSection>

      <section className="flex flex-col gap-2">
        <span className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
          {t("page.dangerSection")}
        </span>
        <div className="overflow-hidden rounded-2xl border border-error-bg bg-error-bg/40">
          <SettingsRow
            icon="trash"
            tone="bg-error text-white"
            title={t("page.deleteAccount")}
            hint={t("page.deleteAccountHint")}
            danger
            onClick={() => setDialog("delete")}
          />
        </div>
      </section>

      <AppDialog
        open={dialog === "password"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={t("page.changePassword")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setDialog(null)}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              onClick={() => {
                toast.info(t("page.notAvailable"));
                setDialog(null);
              }}
            >
              {t("page.updatePassword")}
            </button>
          </>
        }
      >
        <label className="field-group">
          <span>{t("page.currentPassword")}</span>
          <input type="password" autoComplete="current-password" />
        </label>
        <label className="field-group">
          <span>{t("page.newPassword")}</span>
          <input type="password" autoComplete="new-password" />
        </label>
        <label className="field-group">
          <span>{t("page.repeatPassword")}</span>
          <input type="password" placeholder={t("page.repeatPlaceholder")} autoComplete="new-password" />
        </label>
        <small className="px-1 text-caption text-ink-tertiary">{t("page.passwordRule")}</small>
      </AppDialog>

      <AppDialog
        open={dialog === "logoutOthers"}
        onOpenChange={(open) => !open && setDialog(null)}
        variant="confirm"
        title={t("page.logoutOthersTitle")}
        description={t("page.logoutOthersDescription")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setDialog(null)}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              onClick={() => {
                toast.info(t("page.notAvailable"));
                setDialog(null);
              }}
            >
              {t("page.logout")}
            </button>
          </>
        }
      />

      <AppDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        variant="confirm"
        title={t("page.deleteAccountTitle")}
        description={t("page.deleteAccountDescription")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setDialog(null)}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              onClick={() => {
                toast.info(t("page.notAvailable"));
                setDialog(null);
              }}
            >
              {t("page.delete")}
            </button>
          </>
        }
      />
    </ProfileSubPage>
  );
}

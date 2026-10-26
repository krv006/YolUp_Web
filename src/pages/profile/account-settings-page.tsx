import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  OtpInput,
  useAuth,
  useAuthStore,
  useChangePasswordMutation,
  useConfirmTwoFactorMutation,
  useDeleteAccountMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useTwoFactorStatus,
} from "@/modules/auth";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { DeleteAccountDialog } from "./profile-dialogs";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

type DialogId =
  | "password"
  | "delete"
  | "twoFactorEnable"
  | "twoFactorCode"
  | "twoFactorDisable"
  | null;

const TWO_FACTOR_CODE_LENGTH = 5;

const FIELD = "flex flex-col gap-2";
const LABEL = "text-body-sm text-ink-secondary";
const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const { user } = useAuth();
  const changePassword = useChangePasswordMutation();
  const deleteAccount = useDeleteAccountMutation();
  const twoFactor = useTwoFactorStatus();
  const enableTwoFactor = useEnableTwoFactorMutation();
  const confirmTwoFactor = useConfirmTwoFactorMutation();
  const disableTwoFactor = useDisableTwoFactorMutation();
  const logout = useAuthStore((state) => state.logout);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const twoFactorEnabled = twoFactor.data?.enabled === true;

  function closeTwoFactor() {
    setDialog(null);
    setTwoFactorPassword("");
    setTwoFactorCode("");
  }

  function closePassword() {
    setDialog(null);
    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setMismatch(false);
  }

  function savePassword() {
    if (!currentPassword || !newPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    if (newPassword !== repeatPassword) {
      setMismatch(true);
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t("page.passwordChanged"));
          closePassword();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function startTwoFactor() {
    if (!twoFactorPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    enableTwoFactor.mutate(twoFactorPassword, {
      onSuccess: () => {
        setTwoFactorPassword("");
        setDialog("twoFactorCode");
      },
      onError: (error: Error & { status?: number }) =>
        toast.error(error.status === 503 ? t("page.twoFactorSmsUnavailable") : error.message),
    });
  }

  function finishTwoFactor() {
    if (twoFactorCode.length < TWO_FACTOR_CODE_LENGTH) {
      toast.error(t("page.twoFactorCodeRequired"));
      return;
    }
    confirmTwoFactor.mutate(twoFactorCode, {
      onSuccess: () => {
        toast.success(t("page.twoFactorEnabled"));
        closeTwoFactor();
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function stopTwoFactor() {
    if (!twoFactorPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    disableTwoFactor.mutate(twoFactorPassword, {
      onSuccess: () => {
        toast.success(t("page.twoFactorDisabled"));
        closeTwoFactor();
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <ProfileSubPage title={t("page.accountTitle")}>
      <SettingsSection label={t("page.loginSectionTitle")}>
        <SettingsRow
          icon="person"
          tone={SETTINGS_TONES.brand}
          title={t("page.loginLabel")}
          value={user?.username ?? "—"}
          onClick={() => toast.info(t("page.notAvailable"))}
        />
        <SettingsRow
          icon="check-circle"
          tone={SETTINGS_TONES.success}
          title={t("page.phoneLabel")}
          value={user?.phone ? t("page.verified") : "—"}
          onClick={() => toast.info(t("page.notAvailable"))}
        />
      </SettingsSection>

      <SettingsSection label={t("page.securitySectionTitle")}>
        <SettingsRow
          icon="shield"
          tone={SETTINGS_TONES.warning}
          title={t("page.changePassword")}
          hint={
            user?.passwordChangedAt
              ? `${t("page.changePasswordHint")}${user.passwordChangedAt}`
              : undefined
          }
          onClick={() => setDialog("password")}
        />
        <SettingsRow
          icon="shield"
          tone={SETTINGS_TONES.violet}
          title={t("page.twoFactor")}
          value={twoFactorEnabled ? t("page.twoFactorOn") : t("page.twoFactorOff")}
          onClick={() => setDialog(twoFactorEnabled ? "twoFactorDisable" : "twoFactorEnable")}
        />
        <SettingsRow
          icon="clock"
          tone={SETTINGS_TONES.brand}
          title={t("page.loginsTitle")}
          hint={t("page.loginsRowHint")}
          onClick={() => navigate("../logins")}
        />
      </SettingsSection>

      <section className="flex flex-col gap-3">
        <span className="text-title text-ink">{t("page.dangerSectionTitle")}</span>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg bg-danger-bg px-4 py-4 text-left transition-opacity hover:opacity-85"
          onClick={() => setDialog("delete")}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-danger">
            <Icon name="logout" size={18} />
          </span>
          <strong className="min-w-0 flex-1 truncate text-title-sm text-danger">
            {t("page.deleteAccount")}
          </strong>
        </button>
      </section>

      <AppDialog
        open={dialog === "password"}
        onOpenChange={(open) => !open && closePassword()}
        variant="confirm"
        width="lg:w-120"
        title={t("page.changePassword")}
        footer={
          <button
            type="button"
            className={dialogButton.primary}
            disabled={changePassword.isPending}
            onClick={savePassword}
          >
            {t("page.updatePassword")}
          </button>
        }
      >
        <label className={FIELD}>
          <span className={LABEL}>{t("page.currentPassword")}</span>
          <input
            type="password"
            className={INPUT}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>

        <label className={FIELD}>
          <span className={LABEL}>{t("page.newPassword")}</span>
          <input
            type="password"
            className={INPUT}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <small className="text-body-xs text-ink-tertiary">{t("page.passwordRule")}</small>
        </label>

        <label className={FIELD}>
          <span className={LABEL}>{t("page.repeatPassword")}</span>
          <span className="relative flex items-center">
            <input
              type="password"
              className={`${INPUT} ${mismatch ? "border-danger bg-surface pr-11" : ""}`}
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(event) => {
                setRepeatPassword(event.target.value);
                setMismatch(false);
              }}
            />
            {mismatch ? (
              <Icon
                name="error"
                size={18}
                className="pointer-events-none absolute right-4 text-danger"
              />
            ) : null}
          </span>
          {mismatch ? (
            <small className="text-body-xs text-danger">{t("page.passwordMismatch")}</small>
          ) : null}
        </label>
      </AppDialog>

      <AppDialog
        open={dialog === "twoFactorEnable"}
        onOpenChange={(open) => !open && closeTwoFactor()}
        variant="confirm"
        width="lg:w-120"
        title={t("page.twoFactorEnableTitle")}
        description={t("page.twoFactorEnableDescription")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={closeTwoFactor}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={enableTwoFactor.isPending}
              onClick={startTwoFactor}
            >
              {t("page.enable")}
            </button>
          </>
        }
      >
        <label className={FIELD}>
          <span className={LABEL}>{t("page.currentPassword")}</span>
          <input
            type="password"
            className={INPUT}
            autoComplete="current-password"
            value={twoFactorPassword}
            onChange={(event) => setTwoFactorPassword(event.target.value)}
          />
        </label>
      </AppDialog>

      <AppDialog
        open={dialog === "twoFactorCode"}
        onOpenChange={(open) => !open && closeTwoFactor()}
        variant="confirm"
        width="lg:w-120"
        title={t("page.twoFactorCodeTitle")}
        description={t("page.twoFactorCodeDescription")}
        footer={
          <button
            type="button"
            className={dialogButton.primary}
            disabled={confirmTwoFactor.isPending}
            onClick={finishTwoFactor}
          >
            {t("page.confirmCode")}
          </button>
        }
      >
        <OtpInput
          length={TWO_FACTOR_CODE_LENGTH}
          value={twoFactorCode}
          onChange={setTwoFactorCode}
        />

        <span className="flex items-center gap-3">
          <small className="min-w-0 flex-1 truncate text-body-xs text-ink-tertiary">
            {t("page.resendCode")}
          </small>
          <button
            type="button"
            className="shrink-0 text-body-xs text-brand transition-opacity hover:opacity-80"
            onClick={() => {
              closeTwoFactor();
              navigate("../personal");
            }}
          >
            {t("page.changeNumber")}
          </button>
        </span>
      </AppDialog>

      <AppDialog
        open={dialog === "twoFactorDisable"}
        onOpenChange={(open) => !open && closeTwoFactor()}
        variant="confirm"
        width="lg:w-120"
        title={t("page.twoFactorDisableTitle")}
        description={t("page.twoFactorDisableDescription")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={closeTwoFactor}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={disableTwoFactor.isPending}
              onClick={stopTwoFactor}
            >
              {t("page.delete")}
            </button>
          </>
        }
      >
        <label className={FIELD}>
          <span className={LABEL}>{t("page.currentPassword")}</span>
          <input
            type="password"
            className={INPUT}
            autoComplete="current-password"
            value={twoFactorPassword}
            onChange={(event) => setTwoFactorPassword(event.target.value)}
          />
        </label>
      </AppDialog>

      <DeleteAccountDialog
        open={dialog === "delete"}
        pending={deleteAccount.isPending}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onSuccess: () => {
              setDialog(null);
              void logout();
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </ProfileSubPage>
  );
}

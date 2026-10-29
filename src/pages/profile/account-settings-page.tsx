import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  OtpInput,
  PhoneVerifyDialog,
  useAuth,
  useAuthStore,
  useChangePasswordMutation,
  useConfirmTwoFactorMutation,
  useDeleteAccountMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useTwoFactorStatus,
  useConfirmPhoneChangeMutation,
  usePhoneChangeCodeMutation,
  useUpdateSettingsMutation,
} from "@/modules/auth";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_INPUT } from "@/shared/ui/mobile-fields";
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
const RESEND_SECONDS = 60;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return phone;
  const local = digits.slice(-9);
  return `+998 ${local.slice(0, 2)} *** ** ${local.slice(-2)}`;
}

function ResendTimer({ until, pending, onResend }: { until: number | null; pending: boolean; onResend: () => void }) {
  const { t } = useTranslation("account");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  const left = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  if (left > 0)
    return (
      <small className="min-w-0 flex-1 truncate text-body-xs text-ink-tertiary max-lg:text-body-sm max-lg:text-ink-secondary">
        {t("page.mobile.resendIn", { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` })}
      </small>
    );
  return (
    <button
      type="button"
      className="min-w-0 flex-1 truncate text-left text-body-xs text-brand disabled:opacity-50 max-lg:text-body-sm max-lg:font-medium"
      disabled={pending}
      onClick={onResend}
    >
      {t("page.resendCode")}
    </button>
  );
}

const FIELD = "flex flex-col gap-2";
const LABEL = "text-body-sm text-ink-secondary";
const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompact = useIsCompact();
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
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const requestPhoneCode = usePhoneChangeCodeMutation();
  const confirmPhone = useConfirmPhoneChangeMutation();
  const updateSettings = useUpdateSettingsMutation();

  function saveUsername() {
    const value = username?.trim() ?? "";
    if (!value || value === user?.username) {
      setUsername(null);
      return;
    }
    setUsernameError(null);
    updateSettings.mutate(
      { username: value },
      {
        onSuccess: () => {
          toast.success(t("page.usernameSaved"));
          setUsername(null);
        },
        onError: (error: Error) => {
          const field = error instanceof AppError ? error.fields?.username : undefined;
          setUsernameError((Array.isArray(field) ? field[0] : field) ?? error.message);
        },
      }
    );
  }

  const twoFactorEnabled = twoFactor.data?.enabled === true;
  const sheet = isCompact
    ? ({ variant: "adaptive", footerClassName: "px-4 pt-6 pb-8.5" } as const)
    : ({ variant: "confirm", width: "lg:w-120" } as const);
  const input = isCompact ? MOBILE_INPUT : INPUT;
  const field = isCompact ? "flex flex-col gap-[7px]" : FIELD;
  const label = isCompact ? "text-body-sm text-ink" : LABEL;
  const primary = isCompact ? `${dialogButton.primary} h-13 text-title font-semibold` : dialogButton.primary;
  const secondary = isCompact
    ? `${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`
    : dialogButton.secondary;
  const danger = isCompact ? `${dialogButton.danger} h-13 text-title font-semibold` : dialogButton.danger;

  function closeTwoFactor() {
    setDialog(null);
    setTwoFactorPassword("");
    setTwoFactorCode("");
    setResendAt(null);
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
        setResendAt(Date.now() + RESEND_SECONDS * 1000);
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
          onClick={() => {
            setUsernameError(null);
            setUsername(user?.username ?? "");
          }}
        />
        <SettingsRow
          icon={user?.phoneVerified ? "check-circle" : "warning-fill"}
          tone={user?.phoneVerified ? SETTINGS_TONES.success : SETTINGS_TONES.warning}
          title={isCompact ? t("page.mobile.phone") : t("page.phoneLabel")}
          value={user?.phoneVerified ? t("page.verified") : user?.phone ? t("page.notVerified") : t("page.noPhone")}
          onClick={() => setPhoneOpen(true)}
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

      <section className="flex flex-col gap-3 max-lg:gap-[13px]">
        <span className="text-title text-ink max-lg:leading-5 max-lg:font-normal">{t("page.dangerSectionTitle")}</span>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg bg-danger-bg px-4 py-4 text-left transition-opacity hover:opacity-85 max-lg:min-h-[71px] max-lg:rounded-xl max-lg:bg-surface"
          onClick={() => setDialog("delete")}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-danger max-lg:size-10 max-lg:bg-danger-bg max-lg:text-error-text">
            <Icon name="logout" size={18} className="max-lg:size-5" />
          </span>
          <strong className="min-w-0 flex-1 truncate text-title-sm text-danger max-lg:text-title max-lg:text-error-text">
            {t("page.deleteAccount")}
          </strong>
        </button>
      </section>

      <AppDialog
        open={dialog === "password"}
        onOpenChange={(open) => !open && closePassword()}
        {...sheet}
        title={t("page.changePassword")}
        footer={
          <button
            type="button"
            className={primary}
            disabled={changePassword.isPending}
            onClick={savePassword}
          >
            {t("page.updatePassword")}
          </button>
        }
      >
        <div className="flex flex-col gap-4 max-lg:-mt-0.5 max-lg:gap-[15px]">
          <label className={field}>
            <span className={label}>{t("page.currentPassword")}</span>
            <input
              type="password"
              className={input}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label className={field}>
            <span className={label}>{t("page.newPassword")}</span>
            <input
              type="password"
              className={input}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <small className="text-body-xs text-ink-tertiary">{t("page.passwordRule")}</small>
          </label>

          <label className={field}>
            <span className={label}>{t("page.repeatPassword")}</span>
            <span className="relative flex items-center">
              <input
                type="password"
                className={`${input} ${mismatch ? (isCompact ? "border-error-text! pr-12" : "border-danger bg-surface pr-11") : ""}`}
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(event) => {
                  setRepeatPassword(event.target.value);
                  setMismatch(false);
                }}
              />
              {mismatch ? (
                <Icon
                  name={isCompact ? "warning-fill" : "error"}
                  size={isCompact ? 20 : 18}
                  className="pointer-events-none absolute right-4 text-danger"
                />
              ) : null}
            </span>
            {mismatch ? (
              <small className="text-body-xs text-danger">{t("page.passwordMismatch")}</small>
            ) : null}
          </label>
        </div>
      </AppDialog>

      <AppDialog
        open={dialog === "twoFactorEnable"}
        onOpenChange={(open) => !open && closeTwoFactor()}
        {...sheet}
        title={t("page.twoFactorEnableTitle")}
        description={t("page.twoFactorEnableDescription")}
        footer={
          <>
            <button type="button" className={secondary} onClick={closeTwoFactor}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={primary}
              disabled={enableTwoFactor.isPending}
              onClick={startTwoFactor}
            >
              {t("page.enable")}
            </button>
          </>
        }
      >
        <label className={field}>
          <span className={label}>{t("page.currentPassword")}</span>
          <input
            type="password"
            className={input}
            autoComplete="current-password"
            value={twoFactorPassword}
            onChange={(event) => setTwoFactorPassword(event.target.value)}
          />
        </label>
      </AppDialog>

      <AppDialog
        open={dialog === "twoFactorCode"}
        onOpenChange={(open) => !open && closeTwoFactor()}
        {...sheet}
        title={t("page.twoFactorCodeTitle")}
        description={
          isCompact && user?.phone
            ? t("page.mobile.codeSentTo", { phone: maskPhone(user.phone) })
            : t("page.twoFactorCodeDescription")
        }
        footer={
          <button
            type="button"
            className={primary}
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
          <ResendTimer
            until={resendAt}
            pending={enableTwoFactor.isPending}
            onResend={() =>
              enableTwoFactor.mutate(twoFactorPassword, {
                onSuccess: () => setResendAt(Date.now() + RESEND_SECONDS * 1000),
                onError: (error: Error) => toast.error(error.message),
              })
            }
          />
          <button
            type="button"
            className="shrink-0 text-body-xs text-brand transition-opacity hover:opacity-80 max-lg:text-body-sm max-lg:font-medium"
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
        {...sheet}
        title={t("page.twoFactorDisableTitle")}
        description={t("page.twoFactorDisableDescription")}
        footer={
          <>
            <button type="button" className={secondary} onClick={closeTwoFactor}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={danger}
              disabled={disableTwoFactor.isPending}
              onClick={stopTwoFactor}
            >
              {t("page.delete")}
            </button>
          </>
        }
      >
        <label className={field}>
          <span className={label}>{t("page.currentPassword")}</span>
          <input
            type="password"
            className={input}
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
      <PhoneVerifyDialog
        key={phoneOpen ? "open" : "closed"}
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
        phone={user?.phone ?? ""}
        editablePhone
        onRequest={(phone) => requestPhoneCode.mutateAsync(phone)}
        onVerify={async (phone, code) => {
          await confirmPhone.mutateAsync({ phone, code });
          toast.success(t("auth:phoneVerify.verified"));
          setPhoneOpen(false);
        }}
      />

      <AppDialog
        open={username !== null}
        onOpenChange={(open) => !open && setUsername(null)}
        {...sheet}
        title={t("page.usernameTitle")}
        description={t("page.usernameHint")}
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button type="button" className={dialogButton.secondary} onClick={() => setUsername(null)}>
              {t("page.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.primary}
              disabled={updateSettings.isPending || !username?.trim()}
              onClick={saveUsername}
            >
              {t("page.save")}
            </button>
          </div>
        }
      >
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-ink">{t("page.loginLabel")}</span>
          <input
            className={MOBILE_INPUT}
            value={username ?? ""}
            autoFocus
            autoCapitalize="none"
            onChange={(event) => {
              setUsernameError(null);
              setUsername(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveUsername();
            }}
          />
          {usernameError ? <small className="text-body-xs text-error-text">{usernameError}</small> : null}
        </label>
      </AppDialog>
    </ProfileSubPage>
  );
}

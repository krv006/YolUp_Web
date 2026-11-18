import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useAuth,
  useAuthStore,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUpdateSettingsMutation,
} from "@/modules/auth";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MOBILE_INPUT } from "@/shared/ui/mobile-fields";
import { passwordChangeIssues, passwordChangeServerErrors, type PasswordChangeErrors } from "./password-change";
import { DeleteAccountDialog } from "./profile-dialogs";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

type DialogId = "password" | "delete" | null;

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
  const logout = useAuthStore((state) => state.logout);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordChangeErrors>({});
  const [username, setUsername] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
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

  const sheet = isCompact
    ? ({ variant: "adaptive", footerClassName: "px-4 pt-6 pb-8.5" } as const)
    : ({ variant: "confirm", width: "lg:w-120" } as const);
  const input = isCompact ? MOBILE_INPUT : INPUT;
  const field = isCompact ? "flex flex-col gap-[7px]" : FIELD;
  const label = isCompact ? "text-body-sm text-ink" : LABEL;
  const primary = isCompact ? `${dialogButton.primary} h-13 text-title font-semibold` : dialogButton.primary;

  function closePassword() {
    setDialog(null);
    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setPasswordErrors({});
  }

  function savePassword() {
    const issues = passwordChangeIssues(currentPassword, newPassword, repeatPassword);
    const local: PasswordChangeErrors = {
      current: issues.current ? t("page.currentPasswordRequired") : undefined,
      next: issues.next === "rule" ? t("page.passwordRule") : issues.next === "same" ? t("page.passwordSame") : undefined,
      repeat: issues.repeat ? t("page.passwordMismatch") : undefined,
    };
    if (local.current || local.next || local.repeat) {
      setPasswordErrors(local);
      return;
    }
    setPasswordErrors({});
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t("page.passwordChanged"));
          closePassword();
        },
        onError: (error: Error) => setPasswordErrors(passwordChangeServerErrors(error, t("page.passwordChangeFailed"))),
      }
    );
  }

  const invalidInput = isCompact ? "border-error-text!" : "border-danger bg-surface";
  const errorText = "text-body-xs text-danger";

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
          icon="call"
          tone={SETTINGS_TONES.success}
          title={isCompact ? t("page.mobile.phone") : t("page.phoneLabel")}
          value={user?.phone || "—"}
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
              className={`${input} ${passwordErrors.current ? invalidInput : ""}`}
              autoComplete="current-password"
              aria-invalid={Boolean(passwordErrors.current)}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setPasswordErrors((current) => ({ ...current, current: undefined, form: undefined }));
              }}
            />
            {passwordErrors.current ? <small className={errorText}>{passwordErrors.current}</small> : null}
          </label>

          <label className={field}>
            <span className={label}>{t("page.newPassword")}</span>
            <input
              type="password"
              className={`${input} ${passwordErrors.next ? invalidInput : ""}`}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordErrors.next)}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setPasswordErrors((current) => ({ ...current, next: undefined, form: undefined }));
              }}
            />
            <small className={passwordErrors.next ? errorText : "text-body-xs text-ink-tertiary"}>
              {passwordErrors.next ?? t("page.passwordRule")}
            </small>
          </label>

          <label className={field}>
            <span className={label}>{t("page.repeatPassword")}</span>
            <span className="relative flex items-center">
              <input
                type="password"
                className={`${input} ${passwordErrors.repeat ? `${invalidInput} ${isCompact ? "pr-12" : "pr-11"}` : ""}`}
                autoComplete="new-password"
                aria-invalid={Boolean(passwordErrors.repeat)}
                value={repeatPassword}
                onChange={(event) => {
                  setRepeatPassword(event.target.value);
                  setPasswordErrors((current) => ({ ...current, repeat: undefined, form: undefined }));
                }}
              />
              {passwordErrors.repeat ? (
                <Icon
                  name={isCompact ? "warning-fill" : "error"}
                  size={isCompact ? 20 : 18}
                  className="pointer-events-none absolute right-4 text-danger"
                />
              ) : null}
            </span>
            {passwordErrors.repeat ? <small className={errorText}>{passwordErrors.repeat}</small> : null}
          </label>
          {passwordErrors.form ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-2.5 text-body-sm text-error-text">
              <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
              {passwordErrors.form}
            </p>
          ) : null}
        </div>
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

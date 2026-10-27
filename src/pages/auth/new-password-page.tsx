import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AuthButton,
  AuthFieldError,
  AuthPasswordField,
  AuthScreen,
  describeResetError,
  usePasswordResetConfirmMutation,
} from "@/modules/auth";
import { showErrorToast } from "@/shared/ui/app-toast";

const RULES = [
  { id: "length", test: (value: string) => value.length >= 8 },
  { id: "digit", test: (value: string) => /\d/.test(value) },
  { id: "upper", test: (value: string) => /\p{Lu}/u.test(value) },
] as const;

interface NewPasswordState {
  resetToken?: string;
}

export function NewPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as NewPasswordState | null;
  const resetToken = state?.resetToken ?? "";
  const confirmReset = usePasswordResetConfirmMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const passed = RULES.map((rule) => rule.test(password));
  const strong = passed.every(Boolean);
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);

  async function submit() {
    if (!resetToken || !strong || password !== confirm) return;
    try {
      await confirmReset.mutateAsync({ resetToken, password });
      setDone(true);
    } catch (caught) {
      showErrorToast({
        title: t("mobile.login.errorToastTitle"),
        description: describeResetError(caught, t),
      });
    }
  }

  if (!resetToken && !done) return <Navigate to="/forgot-password" replace />;

  if (done)
    return (
      <AuthScreen
        layout="center"
        onBack={() => navigate("/login", { replace: true })}
        hero={
          <span className="grid size-22 place-items-center rounded-full bg-success-bg">
            <span className="grid size-10 place-items-center rounded-full bg-success-fg text-on-action">
              <Check size={22} strokeWidth={3} />
            </span>
          </span>
        }
        title={t("mobile.newPassword.doneTitle")}
        description={t("mobile.newPassword.doneDescription")}
        action={
          <AuthButton onClick={() => navigate("/login", { replace: true })}>
            {t("form.submit")}
          </AuthButton>
        }
      />
    );

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.newPassword.title")}
      description={t("mobile.newPassword.description")}
      action={
        <AuthButton
          onClick={submit}
          loading={confirmReset.isPending}
          loadingLabel={t("mobile.newPassword.submitting")}
          disabled={!strong || !confirm}
        >
          {t("mobile.newPassword.submit")}
        </AuthButton>
      }
    >
      <div className="flex flex-col gap-3">
        <AuthPasswordField
          autoComplete="new-password"
          label={t("mobile.newPassword.passwordLabel")}
          placeholder={t("mobile.newPassword.passwordPlaceholder")}
          value={password}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="flex flex-col gap-3">
          <AuthPasswordField
            autoComplete="new-password"
            label={t("mobile.newPassword.confirmLabel")}
            placeholder={t("mobile.newPassword.confirmPlaceholder")}
            value={confirm}
            invalid={mismatch}
            invalidStyle="border"
            visible={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            onChange={(event) => setConfirm(event.target.value)}
          />
          {mismatch ? <AuthFieldError>{t("mobile.newPassword.mismatch")}</AuthFieldError> : null}
        </div>

        <ul className="flex flex-col gap-1.5 pl-2">
          {RULES.map((rule, index) => (
            <li key={rule.id} className="flex items-center gap-2.5">
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full text-on-action transition-colors ${
                  passed[index] ? "bg-success" : "bg-line-strong"
                }`}
              >
                <Check size={10} strokeWidth={3.5} />
              </span>
              <span
                className={`text-body-sm ${passed[index] ? "font-medium text-ink" : "text-ink-secondary"}`}
              >
                {t(`mobile.newPassword.rules.${rule.id}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AuthScreen>
  );
}

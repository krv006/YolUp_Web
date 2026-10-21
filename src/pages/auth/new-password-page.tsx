import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AuthButton,
  AuthFieldError,
  AuthPasswordField,
  AuthScreen,
  describeResetError,
  usePasswordResetConfirmMutation,
} from "@/modules/auth";

const MIN_LENGTH = 8;

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
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!resetToken) return;
    if (password.length < MIN_LENGTH) {
      setError(t("validation.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("mobile.newPassword.mismatch"));
      return;
    }
    setError(null);
    try {
      await confirmReset.mutateAsync({ resetToken, password });
      toast.success(t("mobile.newPassword.success"));
      navigate("/login", { replace: true });
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      toast.error(message);
    }
  }

  if (!resetToken) return <Navigate to="/forgot-password" replace />;

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
          disabled={!password || !confirm}
        >
          {t("mobile.newPassword.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.login.noAccount")}{" "}
          <Link className="text-action" to="/register">
            {t("mobile.login.registerLink")}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("mobile.newPassword.passwordPlaceholder")}
          aria-label={t("mobile.newPassword.passwordPlaceholder")}
          value={password}
          invalid={Boolean(error)}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          onChange={(event) => {
            setError(null);
            setPassword(event.target.value);
          }}
        />
        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("mobile.newPassword.confirmPlaceholder")}
          aria-label={t("mobile.newPassword.confirmPlaceholder")}
          value={confirm}
          invalid={Boolean(error)}
          visible={showConfirm}
          onToggle={() => setShowConfirm((value) => !value)}
          onChange={(event) => {
            setError(null);
            setConfirm(event.target.value);
          }}
        />
        {error ? <AuthFieldError>{error}</AuthFieldError> : null}
      </div>
    </AuthScreen>
  );
}

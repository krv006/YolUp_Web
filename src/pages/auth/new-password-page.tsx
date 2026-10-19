import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthButton, AuthFieldError, AuthPasswordField, AuthScreen } from "@/modules/auth";

const MIN_LENGTH = 8;

export function NewPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (password.length < MIN_LENGTH) {
      setError(t("validation.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("mobile.newPassword.mismatch"));
      return;
    }
    setError(null);
    toast.info(t("mobile.reset.backendMissing"));
    navigate("/login");
  }

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.newPassword.title")}
      description={t("mobile.newPassword.description")}
      action={
        <AuthButton onClick={submit} disabled={!password || !confirm}>
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

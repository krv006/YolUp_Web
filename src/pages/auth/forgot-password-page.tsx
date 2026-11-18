import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AuthButton,
  AuthField,
  AuthScreen,
  describeResetError,
  isValidEmail,
  normalizeEmail,
  usePasswordResetRequestMutation,
} from "@/modules/auth";
import { showErrorToast } from "@/shared/ui/app-toast";

const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const requestCode = usePasswordResetRequestMutation();
  const initial = (location.state as { email?: string } | null)?.email ?? "";
  const [email, setEmail] = useState(initial);
  const valid = isValidEmail(email);

  async function sendCode() {
    if (!valid) return;
    const address = normalizeEmail(email);
    try {
      const response = await requestCode.mutateAsync(address);
      navigate("/verify-code", {
        state: {
          email: address,
          expiresIn: response.expires_in ?? DEFAULT_EXPIRES_IN,
          retryAfter: response.retry_after ?? DEFAULT_RETRY_AFTER,
        },
      });
    } catch (caught) {
      showErrorToast({
        title: t("mobile.login.errorToastTitle"),
        description: describeResetError(caught, t),
      });
    }
  }

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.reset.title")}
      description={t("mobile.reset.description")}
      action={
        <AuthButton
          onClick={sendCode}
          loading={requestCode.isPending}
          loadingLabel={t("mobile.reset.sending")}
          disabled={!valid}
        >
          {t("mobile.reset.sendCode")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.reset.remembered")}{" "}
          <Link className="font-semibold text-brand-strong" to="/login">
            {t("form.submit")}
          </Link>
        </>
      }
    >
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void sendCode();
        }}
      >
        <AuthField
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          label={t("mobile.reset.emailLabel")}
          placeholder={t("mobile.reset.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <small className="px-1 text-caption text-ink-secondary">{t("mobile.reset.emailHint")}</small>
      </form>
    </AuthScreen>
  );
}

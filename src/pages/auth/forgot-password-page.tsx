import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AuthButton,
  AuthFieldError,
  AuthPhoneField,
  AuthScreen,
  describeResetError,
  usePasswordResetRequestMutation,
} from "@/modules/auth";

const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const requestCode = usePasswordResetRequestMutation();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const value = phone.trim();
    setError(null);
    try {
      const response = await requestCode.mutateAsync(value);
      toast.success(t("mobile.reset.sent"));
      navigate("/verify-code", {
        state: {
          phone: value,
          expiresIn: response.expires_in ?? DEFAULT_EXPIRES_IN,
          retryAfter: response.retry_after ?? DEFAULT_RETRY_AFTER,
        },
      });
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      toast.error(message);
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
          disabled={phone.trim().length < 9}
        >
          {t("mobile.reset.sendCode")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.reset.remembered")}{" "}
          <Link className="text-action" to="/login">
            {t("form.submit")}
          </Link>
        </>
      }
    >
      <AuthPhoneField
        autoFocus
        value={phone}
        invalid={Boolean(error)}
        placeholder={t("mobile.reset.phonePlaceholder")}
        aria-label={t("register.form.phone")}
        hint={t("mobile.reset.phoneHint")}
        onChange={(event) => {
          setError(null);
          setPhone(event.target.value);
        }}
      />

      {error ? <AuthFieldError>{error}</AuthFieldError> : null}
    </AuthScreen>
  );
}

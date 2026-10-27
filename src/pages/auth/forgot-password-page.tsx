import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AuthButton,
  AuthPhoneInput,
  AuthScreen,
  UZ_PHONE_LENGTH,
  describeResetError,
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
  const initial = (location.state as { digits?: string } | null)?.digits ?? "";
  const [digits, setDigits] = useState(initial);

  async function sendCode() {
    const phone = `+998${digits}`;
    try {
      const response = await requestCode.mutateAsync(phone);
      navigate("/verify-code", {
        state: {
          phone,
          digits,
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
          disabled={digits.length < UZ_PHONE_LENGTH}
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
      <AuthPhoneInput
        label={t("mobile.reset.phoneLabel")}
        hint={t("mobile.reset.phoneHint")}
        placeholder={t("mobile.reset.phoneNationalPlaceholder")}
        value={digits}
        onChange={setDigits}
      />
    </AuthScreen>
  );
}

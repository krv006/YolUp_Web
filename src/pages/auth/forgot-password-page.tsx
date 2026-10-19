import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthButton, AuthPhoneField, AuthScreen } from "@/modules/auth";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  function sendCode() {
    toast.info(t("mobile.reset.backendMissing"));
    navigate("/verify-code", { state: { phone } });
  }

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.reset.title")}
      description={t("mobile.reset.description")}
      action={
        <AuthButton onClick={sendCode} disabled={phone.trim().length < 9}>
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
        placeholder={t("mobile.reset.phonePlaceholder")}
        aria-label={t("register.form.phone")}
        hint={t("mobile.reset.phoneHint")}
        onChange={(event) => setPhone(event.target.value)}
      />
    </AuthScreen>
  );
}

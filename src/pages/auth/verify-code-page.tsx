import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthButton, AuthFieldError, AuthScreen, OtpInput } from "@/modules/auth";

const CODE_LENGTH = 5;
const RESEND_SECONDS = 45;

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = globalThis.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => globalThis.clearTimeout(timer);
  }, [seconds]);

  function confirm() {
    if (code.length < CODE_LENGTH) {
      setInvalid(true);
      toast.error(t("mobile.code.errorToastTitle"), {
        description: t("mobile.code.errorToastDescription"),
      });
      return;
    }
    toast.info(t("mobile.reset.backendMissing"));
    navigate("/new-password");
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.code.title")}
      description={t("mobile.code.description")}
      action={<AuthButton onClick={confirm}>{t("mobile.code.submit")}</AuthButton>}
      footer={
        <>
          {t("mobile.reset.remembered")}{" "}
          <Link className="text-action" to="/login">
            {t("form.submit")}
          </Link>
        </>
      }
    >
      <OtpInput
        length={CODE_LENGTH}
        value={code}
        invalid={invalid}
        onChange={(next) => {
          setInvalid(false);
          setCode(next);
        }}
      />

      {invalid ? <AuthFieldError>{t("mobile.code.invalid")}</AuthFieldError> : null}

      {seconds > 0 ? (
        <p className="px-1 text-body-sm text-ink-secondary">
          {t("mobile.code.resendIn")} <b className="font-numeric text-ink">{clock}</b>
        </p>
      ) : (
        <button
          type="button"
          className="self-start px-1 text-label-strong text-action"
          onClick={() => {
            setSeconds(RESEND_SECONDS);
            toast.info(t("mobile.reset.backendMissing"));
          }}
        >
          {t("mobile.code.resend")}
        </button>
      )}
    </AuthScreen>
  );
}

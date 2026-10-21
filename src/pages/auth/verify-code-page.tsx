import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AuthButton,
  AuthFieldError,
  AuthScreen,
  OtpInput,
  describeResetError,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation,
} from "@/modules/auth";

const CODE_LENGTH = 5;
const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

interface ResetCodeState {
  phone?: string;
  expiresIn?: number;
  retryAfter?: number;
}

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as ResetCodeState | null;
  const phone = state?.phone ?? "";
  const verifyCode = usePasswordResetVerifyMutation();
  const requestCode = usePasswordResetRequestMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(state?.expiresIn ?? DEFAULT_EXPIRES_IN);
  const [retryIn, setRetryIn] = useState(state?.retryAfter ?? DEFAULT_RETRY_AFTER);

  useEffect(() => {
    if (expiresIn <= 0 && retryIn <= 0) return undefined;
    const timer = globalThis.setTimeout(() => {
      setExpiresIn((value) => (value > 0 ? value - 1 : 0));
      setRetryIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => globalThis.clearTimeout(timer);
  }, [expiresIn, retryIn]);

  async function confirm() {
    if (!phone) return;
    if (code.length < CODE_LENGTH) {
      setError(t("mobile.code.invalid"));
      toast.error(t("mobile.code.errorToastTitle"), {
        description: t("mobile.code.errorToastDescription"),
      });
      return;
    }
    try {
      const response = await verifyCode.mutateAsync({ phone, code });
      navigate("/new-password", { state: { resetToken: response.reset_token }, replace: true });
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      setCode("");
      toast.error(message);
    }
  }

  async function resend() {
    if (!phone) return;
    try {
      const response = await requestCode.mutateAsync(phone);
      setExpiresIn(response.expires_in ?? DEFAULT_EXPIRES_IN);
      setRetryIn(response.retry_after ?? DEFAULT_RETRY_AFTER);
      setCode("");
      setError(null);
      toast.success(t("mobile.reset.sent"));
    } catch (caught) {
      toast.error(describeResetError(caught, t));
    }
  }

  if (!phone) return <Navigate to="/forgot-password" replace />;

  const clock = `${Math.floor(retryIn / 60)}:${String(retryIn % 60).padStart(2, "0")}`;

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.code.title")}
      description={t("mobile.code.descriptionPhone", { phone })}
      action={
        <AuthButton
          onClick={confirm}
          loading={verifyCode.isPending}
          loadingLabel={t("mobile.code.submitting")}
        >
          {t("mobile.code.submit")}
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
      <OtpInput
        length={CODE_LENGTH}
        value={code}
        invalid={Boolean(error)}
        onChange={(next) => {
          setError(null);
          setCode(next);
        }}
      />

      {error ? <AuthFieldError>{error}</AuthFieldError> : null}

      {expiresIn <= 0 ? (
        <p className="px-1 text-body-sm text-error-text">{t("mobile.code.expired")}</p>
      ) : null}

      {retryIn > 0 ? (
        <p className="px-1 text-body-sm text-ink-secondary">
          {t("mobile.code.resendIn")} <b className="font-numeric text-ink">{clock}</b>
        </p>
      ) : (
        <button
          type="button"
          className="self-start px-1 text-label-strong text-action disabled:opacity-60"
          disabled={requestCode.isPending}
          onClick={resend}
        >
          {t("mobile.code.resend")}
        </button>
      )}
    </AuthScreen>
  );
}

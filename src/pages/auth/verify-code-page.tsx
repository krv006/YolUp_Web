import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AuthButton,
  AuthScreen,
  OtpInput,
  describeResetError,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation,
} from "@/modules/auth";
import { AppError } from "@/shared/api";
import { showErrorToast } from "@/shared/ui/app-toast";

const CODE_LENGTH = 5;
const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

interface ResetCodeState {
  phone?: string;
  digits?: string;
  expiresIn?: number;
  retryAfter?: number;
}

function maskPhone(digits: string): string {
  return `+998 ${digits.slice(0, 2)} ••• •• ${digits.slice(7, 9)}`;
}

function formatClock(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as ResetCodeState | null;
  const phone = state?.phone ?? "";
  const digits = state?.digits ?? phone.replace(/^\+?998/, "");
  const verifyCode = usePasswordResetVerifyMutation();
  const requestCode = usePasswordResetRequestMutation();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
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

  const expired = expiresIn <= 0;

  async function confirm(value = code) {
    if (!phone || value.length < CODE_LENGTH || expired) return;
    try {
      const response = await verifyCode.mutateAsync({ phone, code: value });
      navigate("/new-password", { state: { resetToken: response.reset_token }, replace: true });
    } catch (caught) {
      if (caught instanceof AppError && caught.status >= 400 && caught.status < 500) {
        setInvalid(true);
        return;
      }
      showErrorToast({
        title: t("mobile.code.errorToastTitle"),
        description: describeResetError(caught, t),
      });
    }
  }

  async function resend() {
    if (!phone) return;
    try {
      const response = await requestCode.mutateAsync(phone);
      setExpiresIn(response.expires_in ?? DEFAULT_EXPIRES_IN);
      setRetryIn(response.retry_after ?? DEFAULT_RETRY_AFTER);
      setCode("");
      setInvalid(false);
    } catch (caught) {
      showErrorToast({
        title: t("mobile.code.errorToastTitle"),
        description: describeResetError(caught, t),
      });
    }
  }

  if (!phone) return <Navigate to="/forgot-password" replace />;

  const error = expired ? t("mobile.code.expired") : invalid ? t("mobile.code.invalid") : null;
  const shownCode = expired ? "" : code;

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.code.title")}
      description={t("mobile.code.descriptionPhone", {
        phone: maskPhone(digits),
        length: CODE_LENGTH,
      })}
      action={
        <AuthButton
          onClick={() => confirm()}
          loading={verifyCode.isPending}
          loadingLabel={t("mobile.code.submitting")}
          disabled={expired || code.length < CODE_LENGTH}
        >
          {t("mobile.code.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.code.wrongNumber")}{" "}
          <button
            type="button"
            className="font-semibold text-brand-strong"
            onClick={() => navigate("/forgot-password", { state: { digits }, replace: true })}
          >
            {t("mobile.code.change")}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center">
        <OtpInput
          length={CODE_LENGTH}
          value={shownCode}
          tone={verifyCode.isPending ? "verifying" : invalid ? "invalid" : "idle"}
          onChange={(next) => {
            setInvalid(false);
            setCode(next);
            if (next.length === CODE_LENGTH) void confirm(next);
          }}
        />

        {error ? (
          <p className="mt-3 text-center text-caption text-error-text" role="alert">
            {error}
          </p>
        ) : null}

        {retryIn > 0 && !expired ? (
          <p className="mt-5 flex items-center gap-2 text-body-sm text-ink">
            {t("mobile.code.resendIn")}
            <b className="font-numeric font-semibold">{formatClock(retryIn)}</b>
          </p>
        ) : (
          <button
            type="button"
            className="mt-5 text-body-sm font-semibold text-brand-strong disabled:opacity-60"
            disabled={requestCode.isPending}
            onClick={resend}
          >
            {t("mobile.code.resend")}
          </button>
        )}
      </div>
    </AuthScreen>
  );
}

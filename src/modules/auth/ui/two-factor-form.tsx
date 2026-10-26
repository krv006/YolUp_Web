import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AppError } from "@/shared/api";
import type { TwoFactorChallenge } from "../api/auth.dto";
import { describeTwoFactorChallenge } from "../lib/describe-two-factor";
import { AuthButton, AuthFieldError, AuthScreen } from "./auth-screen";
import { OtpInput } from "./otp-input";

const CODE_LENGTH = 5;

export interface TwoFactorFormProps {
  challenge: TwoFactorChallenge;
  onSubmit: (code: string) => Promise<unknown>;
  onResend: () => Promise<unknown>;
  onCancel: () => void;
}

type TwoFactorState = ReturnType<typeof useTwoFactorChallenge>;

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function useTwoFactorChallenge({
  challenge,
  onSubmit,
  onResend,
}: Omit<TwoFactorFormProps, "onCancel">) {
  const { t } = useTranslation("auth");
  const [tracked, setTracked] = useState(challenge);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(challenge.expiresIn);
  const [retryIn, setRetryIn] = useState(challenge.retryAfter);

  if (tracked !== challenge) {
    setTracked(challenge);
    setCode("");
    setError(null);
    setExpiresIn(challenge.expiresIn);
    setRetryIn(challenge.retryAfter);
  }

  useEffect(() => {
    if (expiresIn <= 0 && retryIn <= 0) return undefined;
    const timer = globalThis.setTimeout(() => {
      setExpiresIn((value) => (value > 0 ? value - 1 : 0));
      setRetryIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => globalThis.clearTimeout(timer);
  }, [expiresIn, retryIn]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (code.length < CODE_LENGTH) {
      setError(t("twoFactor.incomplete"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(code);
    } catch (caught) {
      const message = (caught as AppError).message || t("twoFactor.invalid");
      setError(message);
      setCode("");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await onResend();
      toast.success(t("twoFactor.resent"));
    } catch (caught) {
      toast.error((caught as AppError).message || t("twoFactor.resendFailed"));
    } finally {
      setResending(false);
    }
  }

  function changeCode(next: string) {
    setError(null);
    setCode(next);
  }

  return {
    code,
    error,
    submitting,
    resending,
    expiresIn,
    retryIn,
    expired: expiresIn <= 0,
    submit,
    resend,
    changeCode,
  };
}

function TwoFactorFields({ state }: { state: TwoFactorState }) {
  const { t } = useTranslation("auth");

  return (
    <div className="flex flex-col gap-3">
      <OtpInput
        length={CODE_LENGTH}
        value={state.code}
        invalid={Boolean(state.error)}
        onChange={state.changeCode}
      />

      {state.error ? <AuthFieldError>{state.error}</AuthFieldError> : null}

      {state.expired ? (
        <p className="px-1 text-body-sm text-danger">{t("twoFactor.expired")}</p>
      ) : (
        <p className="px-1 text-body-sm text-ink-secondary">
          {t("twoFactor.validFor")}{" "}
          <b className="font-numeric text-ink">{formatClock(state.expiresIn)}</b>
        </p>
      )}

      {state.retryIn > 0 ? (
        <p className="px-1 text-body-sm text-ink-secondary">
          {t("twoFactor.resendIn")}{" "}
          <b className="font-numeric text-ink">{formatClock(state.retryIn)}</b>
        </p>
      ) : (
        <button
          type="button"
          className="self-start px-1 text-body-sm text-brand disabled:opacity-60"
          disabled={state.resending}
          onClick={state.resend}
        >
          {t("twoFactor.resend")}
        </button>
      )}
    </div>
  );
}

export function TwoFactorForm({ challenge, onSubmit, onResend, onCancel }: TwoFactorFormProps) {
  const { t } = useTranslation("auth");
  const state = useTwoFactorChallenge({ challenge, onSubmit, onResend });

  return (
    <form className="flex flex-col gap-4" onSubmit={state.submit} noValidate>
      <TwoFactorFields state={state} />

      <AuthButton type="submit" loading={state.submitting} loadingLabel={t("twoFactor.submitting")}>
        {t("twoFactor.submit")}
      </AuthButton>

      <button
        type="button"
        className="text-body-sm text-brand transition-opacity hover:opacity-80"
        onClick={onCancel}
      >
        {t("twoFactor.cancel")}
      </button>
    </form>
  );
}

export function MobileTwoFactorForm({
  challenge,
  onSubmit,
  onResend,
  onCancel,
}: TwoFactorFormProps) {
  const { t } = useTranslation("auth");
  const state = useTwoFactorChallenge({ challenge, onSubmit, onResend });

  return (
    <AuthScreen
      onBack={onCancel}
      title={t("twoFactor.title")}
      description={describeTwoFactorChallenge(challenge, t)}
      action={
        <AuthButton
          type="submit"
          form="two-factor-form"
          loading={state.submitting}
          loadingLabel={t("twoFactor.submitting")}
        >
          {t("twoFactor.submit")}
        </AuthButton>
      }
      footer={
        <button type="button" className="text-brand" onClick={onCancel}>
          {t("twoFactor.cancel")}
        </button>
      }
    >
      <form id="two-factor-form" onSubmit={state.submit} noValidate>
        <TwoFactorFields state={state} />
      </form>
    </AuthScreen>
  );
}

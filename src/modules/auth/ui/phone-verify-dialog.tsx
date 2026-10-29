import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/shared/api";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { maskUzPhone, normalizeUzPhone } from "../lib/phone";
import { OtpInput } from "./otp-input";

const CODE_LENGTH = 5;
const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

export interface PhoneVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone?: string;
  editablePhone?: boolean;
  onRequest: (phone: string) => Promise<{ expires_in?: number; retry_after?: number }>;
  onVerify: (phone: string, code: string) => Promise<void>;
}

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof AppError && error.message) return error.message;
  return error instanceof Error && error.message ? error.message : fallback;
}

export function PhoneVerifyDialog({ open, onOpenChange, phone = "", editablePhone = false, onRequest, onVerify }: PhoneVerifyDialogProps) {
  const { t } = useTranslation("auth");
  const [step, setStep] = useState<"phone" | "code">(editablePhone ? "phone" : "code");
  const [number, setNumber] = useState(phone);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [retryIn, setRetryIn] = useState(0);
  const autoSent = useRef(false);

  useEffect(() => {
    if (expiresIn <= 0 && retryIn <= 0) return undefined;
    const timer = globalThis.setTimeout(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setRetryIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => globalThis.clearTimeout(timer);
  }, [expiresIn, retryIn]);

  async function send(target: string) {
    const normalized = normalizeUzPhone(target);
    setBusy(true);
    setError(null);
    try {
      const response = await onRequest(normalized);
      setNumber(normalized);
      setCode("");
      setExpiresIn(response.expires_in ?? DEFAULT_EXPIRES_IN);
      setRetryIn(response.retry_after ?? DEFAULT_RETRY_AFTER);
      setStep("code");
    } catch (caught) {
      setError(errorText(caught, t("phoneVerify.sendFailed")));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open || editablePhone || autoSent.current || !phone) return;
    autoSent.current = true;
    const timer = globalThis.setTimeout(() => void send(phone), 0);
    return () => globalThis.clearTimeout(timer);
  });

  async function confirm(value = code) {
    if (value.length < CODE_LENGTH || expiresIn <= 0) return;
    setBusy(true);
    setError(null);
    try {
      await onVerify(number, value);
    } catch (caught) {
      setError(errorText(caught, t("phoneVerify.invalid")));
    } finally {
      setBusy(false);
    }
  }

  const expired = step === "code" && expiresIn <= 0 && !busy;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:w-110"
      title={step === "phone" ? t("phoneVerify.phoneTitle") : t("phoneVerify.codeTitle")}
      description={
        step === "phone"
          ? t("phoneVerify.phoneHint")
          : t("phoneVerify.codeHint", { phone: maskUzPhone(number), length: CODE_LENGTH })
      }
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button type="button" className={dialogButton.secondary} onClick={() => onOpenChange(false)}>
            {t("phoneVerify.cancel")}
          </button>
          {step === "phone" ? (
            <button
              type="button"
              className={dialogButton.primary}
              disabled={busy || normalizeUzPhone(number).replace(/\D/g, "").length !== 12}
              onClick={() => void send(number)}
            >
              {t("phoneVerify.send")}
            </button>
          ) : (
            <button
              type="button"
              className={dialogButton.primary}
              disabled={busy || code.length < CODE_LENGTH || expired}
              onClick={() => void confirm()}
            >
              {t("phoneVerify.confirm")}
            </button>
          )}
        </div>
      }
    >
      {step === "phone" ? (
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-ink">{t("phoneVerify.phoneLabel")}</span>
          <input
            className="h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-body text-ink outline-none focus:border-focus"
            inputMode="tel"
            autoFocus
            value={number}
            placeholder="+998 90 123 45 67"
            onChange={(event) => setNumber(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void send(number);
            }}
          />
        </label>
      ) : (
        <div className="flex flex-col items-center gap-4 py-2">
          <OtpInput
            length={CODE_LENGTH}
            value={expired ? "" : code}
            tone={busy ? "verifying" : error ? "invalid" : "idle"}
            onChange={(next) => {
              setError(null);
              setCode(next);
              if (next.length === CODE_LENGTH) void confirm(next);
            }}
          />
          {retryIn > 0 && !expired ? (
            <p className="flex items-center gap-2 text-body-sm text-ink">
              {t("phoneVerify.resendIn")}
              <b className="font-numeric font-semibold">{clock(retryIn)}</b>
            </p>
          ) : (
            <button
              type="button"
              className="text-body-sm font-semibold text-brand-strong disabled:opacity-60"
              disabled={busy}
              onClick={() => void send(number)}
            >
              {t("phoneVerify.resend")}
            </button>
          )}
          {editablePhone ? (
            <button
              type="button"
              className="text-body-xs font-medium text-ink-secondary hover:text-ink"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
            >
              {t("phoneVerify.changeNumber")}
            </button>
          ) : null}
        </div>
      )}
      {error || expired ? (
        <p className="mt-3 text-center text-body-xs text-error-text" role="alert">
          {error ?? t("phoneVerify.expired")}
        </p>
      ) : null}
    </AppDialog>
  );
}

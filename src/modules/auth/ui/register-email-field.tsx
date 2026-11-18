import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth.api";
import { EMAIL_CODE_LENGTH, describeEmailCodeError, isValidEmail } from "../lib/email-code";
import { useEmailCode } from "../model/use-email-code";
import { AuthField, AuthFieldError } from "./auth-screen";
import { OtpInput } from "./otp-input";

export interface RegisterEmail {
  email: string;
  token: string | null;
}

export interface RegisterEmailFieldProps {
  required: boolean;
  value: RegisterEmail;
  onChange: (value: RegisterEmail) => void;
  error?: string | null;
}

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function RegisterEmailField({ required, value, onChange, error }: RegisterEmailFieldProps) {
  const { t } = useTranslation("auth");
  const flow = useEmailCode({
    request: async (email) => {
      const sent = await authApi.requestRegisterEmailCode(email);
      return { expiresIn: sent?.expires_in, retryAfter: sent?.retry_after };
    },
    verify: async (email, code) => {
      const result = await authApi.verifyRegisterEmailCode(email, code);
      onChange({ email, token: result.email_token });
    },
    describe: (caught) => describeEmailCodeError(caught, t),
  });
  const valid = isValidEmail(value.email);
  const shownError = flow.error ?? error ?? null;

  function change() {
    flow.reset();
    onChange({ email: value.email, token: null });
  }

  const smallButton =
    "shrink-0 rounded-full px-3 py-1.5 text-caption-strong text-brand transition-colors hover:bg-brand-subtle disabled:opacity-40";

  return (
    <div className="flex flex-col gap-2">
      <AuthField
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={required ? t("email.placeholderRequired") : t("email.placeholderOptional")}
        aria-label={required ? t("email.placeholderRequired") : t("email.placeholderOptional")}
        value={value.email}
        readOnly={flow.stage !== "idle"}
        invalid={Boolean(shownError) && flow.stage === "idle"}
        onChange={(event) => onChange({ email: event.target.value, token: null })}
        trailing={
          flow.stage === "verified" ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="flex items-center gap-1 text-caption-strong text-success-fg">
                <Check size={15} /> {t("email.verified")}
              </span>
              <button type="button" className={smallButton} onClick={change}>
                {t("email.change")}
              </button>
            </span>
          ) : flow.stage === "sent" ? (
            <button type="button" className={smallButton} onClick={change}>
              {t("email.change")}
            </button>
          ) : (
            <button
              type="button"
              className={smallButton}
              disabled={!valid || flow.sending}
              onClick={() => {
                onChange({ email: value.email, token: null });
                void flow.send(value.email);
              }}
            >
              {flow.sending ? t("email.sending") : t("email.getCode")}
            </button>
          )
        }
      />

      {flow.stage === "idle" && !shownError ? (
        <small className="px-1 text-caption text-ink-secondary">
          {required ? t("email.hintRequired") : t("email.hintOptional")}
        </small>
      ) : null}

      {flow.stage === "sent" ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-subtle/60 px-3 py-3">
          <small className="text-center text-caption text-ink-secondary">
            {t("email.sentTo", { email: flow.sentTo, length: EMAIL_CODE_LENGTH })}
          </small>
          <OtpInput
            length={EMAIL_CODE_LENGTH}
            value={flow.expired ? "" : flow.code}
            tone={flow.verifying ? "verifying" : flow.invalid ? "invalid" : "idle"}
            onChange={flow.setCode}
          />
          {flow.expired ? (
            <small className="text-caption text-error-text">{t("email.expired")}</small>
          ) : flow.invalid ? (
            <small className="text-caption text-error-text">{t("email.invalidCode")}</small>
          ) : null}
          {flow.retryIn > 0 && !flow.expired ? (
            <small className="text-caption text-ink-secondary">
              {t("email.resendIn")} <b className="font-numeric">{clock(flow.retryIn)}</b>
            </small>
          ) : (
            <button
              type="button"
              className="text-caption-strong text-brand disabled:opacity-50"
              disabled={flow.sending}
              onClick={() => void flow.resend()}
            >
              {t("email.resend")}
            </button>
          )}
        </div>
      ) : null}

      {shownError ? <AuthFieldError>{shownError}</AuthFieldError> : null}
    </div>
  );
}

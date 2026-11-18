import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuthUser } from "@/shared/types";
import { dialogButton } from "@/shared/ui/app-dialog";
import { authApi } from "../api/auth.api";
import { mapUserDto } from "../lib/auth.mappers";
import { EMAIL_CODE_LENGTH, describeEmailCodeError, isValidEmail } from "../lib/email-code";
import { useAuthStore } from "../model/auth.store";
import { useEmailCode } from "../model/use-email-code";
import { OtpInput } from "./otp-input";

const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export interface EmailVerifyFormProps {
  initialEmail: string;
  onVerified: (user: AuthUser) => void;
}

export function EmailVerifyForm({ initialEmail, onVerified }: EmailVerifyFormProps) {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState(initialEmail);
  const flow = useEmailCode({
    request: async (address) => {
      const sent = await authApi.requestEmailChange(address);
      return { expiresIn: sent?.expires_in, retryAfter: sent?.retry_after };
    },
    verify: async (address, code) => {
      const user = mapUserDto(await authApi.confirmEmailChange(address, code));
      useAuthStore.getState().setUser(user);
      onVerified(user);
    },
    describe: (caught) => describeEmailCodeError(caught, t),
  });

  if (flow.stage === "sent")
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-center text-body-sm text-ink-secondary">
          {t("email.sentTo", { email: flow.sentTo, length: EMAIL_CODE_LENGTH })}{" "}
          <button type="button" className="font-semibold text-brand" onClick={flow.reset}>
            {t("email.change")}
          </button>
        </p>
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
        {flow.error ? <small className="text-center text-caption text-error-text">{flow.error}</small> : null}
        {flow.retryIn > 0 && !flow.expired ? (
          <small className="text-caption text-ink-secondary">
            {t("email.resendIn")} <b className="font-numeric">{clock(flow.retryIn)}</b>
          </small>
        ) : (
          <button
            type="button"
            className="text-body-sm font-semibold text-brand disabled:opacity-50"
            disabled={flow.sending}
            onClick={() => void flow.resend()}
          >
            {t("email.resend")}
          </button>
        )}
      </div>
    );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (isValidEmail(email)) void flow.send(email);
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-ink">{t("emailVerify.label")}</span>
        <input
          className={INPUT}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("mobile.reset.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <small className="text-caption text-ink-secondary">{t("emailVerify.hint")}</small>
      </label>
      {flow.error ? <small className="text-caption text-error-text">{flow.error}</small> : null}
      <button type="submit" className={`${dialogButton.primary} w-full flex-none`} disabled={!isValidEmail(email) || flow.sending}>
        {flow.sending ? t("email.sending") : t("emailVerify.sendCode")}
      </button>
    </form>
  );
}

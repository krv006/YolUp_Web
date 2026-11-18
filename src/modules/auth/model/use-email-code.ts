import { useEffect, useState } from "react";
import { AppError } from "@/shared/api";
import { EMAIL_CODE_EXPIRES_IN, EMAIL_CODE_LENGTH, EMAIL_CODE_RETRY_AFTER, normalizeEmail } from "../lib/email-code";

export type EmailCodeStage = "idle" | "sent" | "verified";

export interface EmailCodeSent {
  expiresIn?: number | null;
  retryAfter?: number | null;
}

export interface UseEmailCodeOptions {
  request: (email: string) => Promise<EmailCodeSent>;
  verify: (email: string, code: string) => Promise<void>;
  describe: (error: unknown) => string;
}

export function useEmailCode({ request, verify, describe }: UseEmailCodeOptions) {
  const [stage, setStage] = useState<EmailCodeStage>("idle");
  const [sentTo, setSentTo] = useState("");
  const [code, setCodeValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [retryIn, setRetryIn] = useState(0);

  useEffect(() => {
    if (stage !== "sent" || (expiresIn <= 0 && retryIn <= 0)) return undefined;
    const timer = globalThis.setTimeout(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setRetryIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => globalThis.clearTimeout(timer);
  }, [stage, expiresIn, retryIn]);

  async function send(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    setSending(true);
    setError(null);
    try {
      const sent = await request(email);
      setSentTo(email);
      setStage("sent");
      setCodeValue("");
      setInvalid(false);
      setExpiresIn(sent.expiresIn ?? EMAIL_CODE_EXPIRES_IN);
      setRetryIn(sent.retryAfter ?? EMAIL_CODE_RETRY_AFTER);
      return true;
    } catch (caught) {
      setError(describe(caught));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function submit(value: string) {
    if (stage !== "sent" || value.length < EMAIL_CODE_LENGTH || expiresIn <= 0) return;
    setVerifying(true);
    setError(null);
    try {
      await verify(sentTo, value);
      setStage("verified");
    } catch (caught) {
      if (caught instanceof AppError && caught.status === 400) setInvalid(true);
      else setError(describe(caught));
    } finally {
      setVerifying(false);
    }
  }

  function setCode(next: string) {
    setInvalid(false);
    setError(null);
    setCodeValue(next);
    if (next.length === EMAIL_CODE_LENGTH) void submit(next);
  }

  function reset() {
    setStage("idle");
    setCodeValue("");
    setError(null);
    setInvalid(false);
    setExpiresIn(0);
    setRetryIn(0);
  }

  return {
    stage,
    sentTo,
    code,
    setCode,
    send,
    resend: () => send(sentTo),
    submit: () => submit(code),
    reset,
    error,
    invalid,
    sending,
    verifying,
    expiresIn,
    retryIn,
    expired: stage === "sent" && expiresIn <= 0,
  };
}

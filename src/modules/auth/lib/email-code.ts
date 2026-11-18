import type { TFunction } from "i18next";
import { AppError } from "@/shared/api";

export const EMAIL_CODE_LENGTH = 5;
export const EMAIL_CODE_EXPIRES_IN = 120;
export const EMAIL_CODE_RETRY_AFTER = 45;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function firstField(error: AppError, key: string): string | null {
  const value = error.fields?.[key];
  if (Array.isArray(value)) return value[0] ? String(value[0]) : null;
  return value ? String(value) : null;
}

export function describeEmailCodeError(error: unknown, t: TFunction<"auth">): string {
  if (error instanceof AppError) {
    if (error.status === 503) return t("email.unavailable");
    if (error.status === 502) return t("email.sendFailed");
    if (error.status === 429)
      return error.retryAfter ? t("email.tooManyWait", { seconds: error.retryAfter }) : t("email.tooMany");
    const field = firstField(error, "email") ?? firstField(error, "code");
    if (field) return field;
    if (error.message) return error.message;
  }
  return t("email.failed");
}

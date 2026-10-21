import type { TFunction } from "i18next";
import { AppError } from "@/shared/api";

export function describeResetError(error: unknown, t: TFunction<"auth">): string {
  if (error instanceof AppError) {
    if (error.status === 503) return t("mobile.reset.smsUnavailable");
    if (error.message) return error.message;
  }
  return t("mobile.reset.failed");
}

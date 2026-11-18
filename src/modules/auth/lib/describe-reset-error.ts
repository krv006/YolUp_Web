import type { TFunction } from "i18next";
import { AppError } from "@/shared/api";
import { describeEmailCodeError } from "./email-code";

export function describeResetError(error: unknown, t: TFunction<"auth">): string {
  if (error instanceof AppError) {
    if (error.status === 503 || error.status === 502 || error.status === 429) return describeEmailCodeError(error, t);
    if (error.message) return error.message;
  }
  return t("mobile.reset.failed");
}

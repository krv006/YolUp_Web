import { AppError } from "@/shared/api";

export function isConsentRequired(error: unknown): boolean {
  return error instanceof AppError && error.code === "consent_required";
}

export function retryMinutes(error: unknown): number | null {
  return error instanceof AppError && error.status === 429 && error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : null;
}

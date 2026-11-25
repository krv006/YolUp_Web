import { API_ERROR_CODES, AppError } from "@/shared/api";

export function uploadFailureReason(error: unknown, timeoutText: string): string | null {
  if (!(error instanceof AppError)) return error instanceof Error ? error.message : null;
  if (error.code === API_ERROR_CODES.TIMEOUT) return timeoutText;
  const field = error.fields?.file;
  const fileMessage = Array.isArray(field) ? field[0] : field;
  return fileMessage || error.message || null;
}

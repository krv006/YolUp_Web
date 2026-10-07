import { AppError } from "@/shared/api";

/** Backend maydon xatosi (`error.details.<field>`) — bo'lmasa umumiy xabar. */
export function homeworkFieldError(error: unknown, field: string): string {
  if (error instanceof AppError) {
    const value = error.fields?.[field];
    const message = Array.isArray(value) ? value[0] : value;
    if (message) return message;
    if (error.detail) return error.detail;
  }
  return error instanceof Error ? error.message : String(error);
}

import { AppError } from "@/shared/api";

export function quizErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    const first = Object.values(error.fields ?? {})[0];
    const message = Array.isArray(first) ? first[0] : first;
    if (message) return message;
    if (error.detail) return error.detail;
  }
  return error instanceof Error ? error.message : String(error);
}

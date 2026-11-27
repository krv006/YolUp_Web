import type { AppError } from "@/shared/api";

export function loginErrorMessage(error: AppError | null | undefined, language: string, fallback: string): string {
  if (!error) return fallback;
  if (error.status === 401) return error.details && language.startsWith("uz") ? error.message : fallback;
  return error.message || fallback;
}

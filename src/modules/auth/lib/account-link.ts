import { normalizeRole } from "@/modules/permission";
import { AppError } from "@/shared/api";
import type { Role } from "@/shared/constants";

export interface ExistingAccount {
  id: string;
  username: string;
  role: Role;
}

export interface LinkError {
  kind: "field" | "two_factor" | "throttled" | "other";
  field: "username" | "password" | null;
  message: string;
  retryMinutes: number | null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join(" ") : typeof value === "string" ? value : "";
}

export function existingAccountOf(error: unknown): ExistingAccount | null {
  if (!(error instanceof AppError) || error.code !== "account_exists") return null;
  const account = record(record(error.details)?.account);
  const username = text(account?.username);
  if (!account || !username) return null;
  return { id: text(account.id), username, role: normalizeRole(text(account.role)) as Role };
}

export function linkErrorOf(error: unknown): LinkError {
  if (!(error instanceof AppError)) {
    return { kind: "other", field: null, message: error instanceof Error ? error.message : "", retryMinutes: null };
  }
  if (error.status === 429) {
    return {
      kind: "throttled",
      field: null,
      message: error.message,
      retryMinutes: error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : null,
    };
  }
  if (error.code === "two_factor_enabled") return { kind: "two_factor", field: null, message: error.message, retryMinutes: null };
  for (const field of ["password", "username"] as const) {
    const message = text(error.fields?.[field]);
    if (message) return { kind: "field", field, message, retryMinutes: null };
  }
  return { kind: "other", field: null, message: error.message, retryMinutes: null };
}

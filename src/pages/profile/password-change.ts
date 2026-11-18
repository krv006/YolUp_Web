import { AppError } from "@/shared/api";

export interface PasswordChangeErrors {
  current?: string;
  next?: string;
  repeat?: string;
  form?: string;
}

export type PasswordIssue = "required" | "rule" | "same" | "mismatch";

export function passwordMeetsRule(value: string): boolean {
  return value.length >= 8 && /\d/.test(value) && /\p{Lu}/u.test(value);
}

export function passwordChangeIssues(current: string, next: string, repeat: string) {
  const issues: { current?: PasswordIssue; next?: PasswordIssue; repeat?: PasswordIssue } = {};
  if (!current) issues.current = "required";
  if (!passwordMeetsRule(next)) issues.next = "rule";
  else if (next === current) issues.next = "same";
  if (!issues.next && repeat !== next) issues.repeat = "mismatch";
  return issues;
}

function joined(value: unknown): string | null {
  if (Array.isArray(value)) return value.length ? value.map(String).join(" ") : null;
  return value ? String(value) : null;
}

export function passwordChangeServerErrors(error: unknown, fallback: string): PasswordChangeErrors {
  if (!(error instanceof AppError)) return { form: fallback };
  const next = joined(error.fields?.new_password);
  if (next) return { next };
  const current = joined(error.fields?.current_password);
  if (current) return { current };
  if (error.status === 400) return { current: error.message || fallback };
  return { form: error.message || fallback };
}

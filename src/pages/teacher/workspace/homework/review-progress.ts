import type { Submission } from "@/shared/types";

const HANDLED = new Set(["done", "resubmit_requested"]);

export function nextPendingSubmission(rows: readonly Submission[], currentId: string): Submission | null {
  const start = rows.findIndex((row) => row.id === currentId);
  const ordered = start < 0 ? rows : [...rows.slice(start + 1), ...rows.slice(0, start)];
  return ordered.find((row) => row.id !== currentId && !HANDLED.has(row.status)) ?? null;
}

export function reviewedCount(rows: readonly Submission[], currentId: string): number {
  return rows.filter((row) => row.id !== currentId && HANDLED.has(row.status)).length + 1;
}

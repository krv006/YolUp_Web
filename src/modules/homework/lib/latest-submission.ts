import type { Submission } from "@/shared/types";

function time(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function latestSubmission(list: readonly Submission[]): Submission | null {
  return list.reduce<Submission | null>(
    (latest, item) => (!latest || time(item.createdAt) > time(latest.createdAt) ? item : latest),
    null
  );
}

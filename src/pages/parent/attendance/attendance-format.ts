import type { AttendanceEntry } from "@/modules/parent";

export function stayLabel(entry: AttendanceEntry, now: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  const row = entry.row;
  if (!row?.joinedAt) return "—";
  const minutes = row.minutes ?? Math.max(0, Math.floor((now - Date.parse(row.joinedAt)) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? t("home.recent.durationHours", { h, m }) : t("home.recent.durationMinutes", { m });
}

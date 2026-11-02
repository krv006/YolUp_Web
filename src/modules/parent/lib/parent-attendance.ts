import type { AttendanceRow, Lesson } from "@/shared/types";
import { lessonOutcome, startOfDay, startOfWeek } from "./parent-home";

const DAY_MS = 86_400_000;

export type AttendanceStatus = "live" | "attended" | "late" | "missed" | "upcoming";
export type AttendancePeriod = "week" | "month" | "quarter" | "all";

export interface AttendanceEntry {
  lesson: Lesson;
  row: AttendanceRow | null;
  status: AttendanceStatus;
  lateMinutes: number;
  focus: number | null;
}

export interface AttendanceStats {
  attended: number;
  late: number;
  missed: number;
  percent: number | null;
  averageFocus: number | null;
  bestWeekday: number | null;
}

export interface AttendanceFilter {
  period: AttendancePeriod;
  courseId: string | null;
  statuses: ReadonlySet<AttendanceStatus>;
  query: string;
}

export function rowFocus(row: AttendanceRow | null): number | null {
  if (!row?.joinedAt) return null;
  if (row.focusPercent !== null && row.focusPercent !== undefined) return Math.round(row.focusPercent);
  if (!row.minutes) return null;
  return Math.max(0, Math.min(100, Math.round(100 - (row.focus.awaySeconds * 100) / (row.minutes * 60))));
}

export function attendanceEntries(lessons: Lesson[], rows: Map<string, AttendanceRow>): AttendanceEntry[] {
  return lessons
    .map((lesson) => {
      const row = rows.get(lesson.id) ?? null;
      const outcome = lessonOutcome(lesson, row ?? undefined);
      const status: AttendanceStatus =
        outcome.kind === "attended" ? (outcome.lateMinutes ? "late" : "attended") : outcome.kind;
      return {
        lesson,
        row,
        status,
        lateMinutes: outcome.kind === "attended" ? outcome.lateMinutes : 0,
        focus: rowFocus(row),
      };
    })
    .sort((a, b) => b.lesson.startsAt.localeCompare(a.lesson.startsAt));
}

export function periodStart(now: number, period: AttendancePeriod): number | null {
  if (period === "all") return null;
  if (period === "week") return startOfWeek(now).getTime();
  const date = startOfDay(now);
  date.setDate(1);
  if (period === "quarter") date.setMonth(date.getMonth() - 2);
  return date.getTime();
}

export function filterEntries(entries: AttendanceEntry[], filter: AttendanceFilter, now: number): AttendanceEntry[] {
  const from = periodStart(now, filter.period);
  const needle = filter.query.trim().toLowerCase();
  return entries.filter((entry) => {
    const at = Date.parse(entry.lesson.startsAt);
    if (from !== null && at < from) return false;
    if (filter.courseId && entry.lesson.courseId !== filter.courseId) return false;
    const status = entry.status === "live" ? "attended" : entry.status;
    if (!filter.statuses.has(status)) return false;
    if (!needle) return true;
    return `${entry.lesson.courseTitle} ${entry.lesson.title}`.toLowerCase().includes(needle);
  });
}

export function attendanceStats(entries: AttendanceEntry[]): AttendanceStats {
  let attended = 0;
  let late = 0;
  let missed = 0;
  const byWeekday = new Map<number, number[]>();
  const focuses: number[] = [];
  for (const entry of entries) {
    if (entry.status === "attended") attended += 1;
    if (entry.status === "late") late += 1;
    if (entry.status === "missed") missed += 1;
    if (entry.focus !== null && entry.status !== "live") {
      focuses.push(entry.focus);
      const weekday = (new Date(entry.lesson.startsAt).getDay() + 6) % 7;
      byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), entry.focus]);
    }
  }
  const total = attended + late + missed;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  let bestWeekday: number | null = null;
  let best = -1;
  for (const [weekday, values] of byWeekday) {
    const value = mean(values);
    if (value > best || (value === best && bestWeekday !== null && weekday < bestWeekday)) {
      best = value;
      bestWeekday = weekday;
    }
  }
  return {
    attended,
    late,
    missed,
    percent: total ? Math.round(((attended + late) / total) * 100) : null,
    averageFocus: focuses.length ? Math.round(mean(focuses)) : null,
    bestWeekday,
  };
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0);
  const cells = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function dayKey(value: string | number | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function entriesByDay(entries: AttendanceEntry[]): Map<string, AttendanceEntry[]> {
  const map = new Map<string, AttendanceEntry[]>();
  for (const entry of [...entries].sort((a, b) => a.lesson.startsAt.localeCompare(b.lesson.startsAt))) {
    const key = dayKey(entry.lesson.startsAt);
    map.set(key, [...(map.get(key) ?? []), entry]);
  }
  return map;
}

const DAY_PRIORITY: AttendanceStatus[] = ["missed", "late", "live", "attended", "upcoming"];

export function dayStatus(entries: AttendanceEntry[] | undefined): AttendanceStatus | null {
  if (!entries?.length) return null;
  return DAY_PRIORITY.find((status) => entries.some((entry) => entry.status === status)) ?? null;
}

export function monthsWithLessons(entries: AttendanceEntry[], now: number): Array<{ year: number; month: number; count: number }> {
  const counts = new Map<string, { year: number; month: number; count: number }>();
  for (const entry of entries) {
    if (entry.status === "upcoming" || Date.parse(entry.lesson.startsAt) > now) continue;
    const date = new Date(entry.lesson.startsAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const current = counts.get(key) ?? { year: date.getFullYear(), month: date.getMonth(), count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}

export function inMonth(entry: AttendanceEntry, year: number, month: number): boolean {
  const date = new Date(entry.lesson.startsAt);
  return date.getFullYear() === year && date.getMonth() === month;
}

export function exitSegments(entry: AttendanceEntry): Array<{ from: number; to: number; away: boolean }> {
  const row = entry.row;
  if (!row?.joinedAt) return [];
  const start = Date.parse(row.joinedAt);
  const end = row.leftAt ? Date.parse(row.leftAt) : start + (row.minutes ?? 0) * 60_000;
  const span = end - start;
  if (span <= 0) return [{ from: 0, to: 1, away: false }];
  const segments: Array<{ from: number; to: number; away: boolean }> = [];
  let cursor = 0;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  for (const exit of [...row.focus.timeline].sort((a, b) => a.leftAt.localeCompare(b.leftAt))) {
    const from = clamp((Date.parse(exit.leftAt) - start) / span);
    const back = exit.returnedAt ? Date.parse(exit.returnedAt) : Date.parse(exit.leftAt) + (exit.seconds ?? 0) * 1000;
    const to = clamp((back - start) / span);
    if (from > cursor) segments.push({ from: cursor, to: from, away: false });
    if (to > from) segments.push({ from, to, away: true });
    cursor = Math.max(cursor, to);
  }
  if (cursor < 1) segments.push({ from: cursor, to: 1, away: false });
  return segments;
}

export function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Array<string | number | null>>): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

export function daysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

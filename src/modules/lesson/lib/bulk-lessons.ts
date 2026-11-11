import { mapLessonRequest } from "./lesson.mappers";
import { overlaps, toMinutes } from "./lesson-schedule";

export const MAX_BULK_LESSONS = 50;

export interface BulkLessonRow {
  id: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
}

export interface BulkLessonsRequestDto {
  course: string;
  lessons: Array<{ title: string; starts_at: string; duration_min: number }>;
}

let rowSequence = 0;

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function createBulkRow(seed: Omit<BulkLessonRow, "id">): BulkLessonRow {
  rowSequence += 1;
  return { id: `bulk-${rowSequence}`, ...seed };
}

export function nextBulkRow(previous: BulkLessonRow): BulkLessonRow {
  return createBulkRow({ topic: "", date: shiftDate(previous.date, 1), time: previous.time, duration: previous.duration });
}

export function isBulkRowInPast(row: Pick<BulkLessonRow, "date" | "time">, now: Date = new Date()): boolean {
  const start = toMinutes(row.date, row.time);
  if (start === null) return true;
  const current = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()) / 60_000;
  return start <= current;
}

export function bulkRowsReady(rows: readonly BulkLessonRow[], now: Date = new Date()): boolean {
  return (
    rows.length > 0 &&
    rows.length <= MAX_BULK_LESSONS &&
    rows.every((row) => Boolean(row.topic.trim()) && !isBulkRowInPast(row, now))
  );
}

export function findBulkOverlaps(rows: readonly BulkLessonRow[]): Set<string> {
  const clashing = new Set<string>();
  rows.forEach((row, index) => {
    const start = toMinutes(row.date, row.time);
    if (start === null) return;
    for (const other of rows.slice(index + 1)) {
      const otherStart = toMinutes(other.date, other.time);
      if (otherStart === null || !overlaps(start, row.duration, otherStart, other.duration)) continue;
      clashing.add(row.id);
      clashing.add(other.id);
    }
  });
  return clashing;
}

export function bulkLessonsRequest(courseId: string, rows: readonly BulkLessonRow[]): BulkLessonsRequestDto {
  return {
    course: courseId,
    lessons: rows.map((row) => {
      const dto = mapLessonRequest({ topic: row.topic.trim(), date: row.date, time: row.time, duration: row.duration });
      return { title: dto.title, starts_at: dto.starts_at, duration_min: dto.duration_min };
    }),
  };
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = firstMessage(item);
      if (message) return message;
    }
  }
  return null;
}

export function bulkLessonErrors(details: unknown): Record<number, string> {
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  const lessons = (details as { lessons?: unknown }).lessons;
  if (!lessons || typeof lessons !== "object" || Array.isArray(lessons)) return {};
  const errors: Record<number, string> = {};
  for (const [key, value] of Object.entries(lessons)) {
    const index = Number(key);
    const message = firstMessage(value);
    if (Number.isInteger(index) && index >= 0 && message) errors[index] = message;
  }
  return errors;
}

export function bulkRowErrors(error: unknown, rows: readonly BulkLessonRow[]): Record<string, string> {
  const details = error && typeof error === "object" ? (error as { details?: unknown }).details : null;
  const errors: Record<string, string> = {};
  for (const [index, message] of Object.entries(bulkLessonErrors(details))) {
    const row = rows[Number(index)];
    if (row) errors[row.id] = message;
  }
  return errors;
}

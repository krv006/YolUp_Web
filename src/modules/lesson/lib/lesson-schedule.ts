import type { Lesson } from "@/shared/types";


export interface Weekday {
  value: number;
  label: string;
  short: string;
}

export const WEEKDAYS: readonly Weekday[] = Object.freeze([
  { value: 1, label: "Dushanba", short: "Du" },
  { value: 2, label: "Seshanba", short: "Se" },
  { value: 3, label: "Chorshanba", short: "Ch" },
  { value: 4, label: "Payshanba", short: "Pa" },
  { value: 5, label: "Juma", short: "Ju" },
  { value: 6, label: "Shanba", short: "Sh" },
  { value: 7, label: "Yakshanba", short: "Ya" },
]);

export const ODD_WEEKDAYS: readonly number[] = Object.freeze([1, 3, 5]);
export const EVEN_WEEKDAYS: readonly number[] = Object.freeze([2, 4, 6]);

export const MAX_SCHEDULE_LESSONS = 120;

export interface ScheduleInput {
  startsOn: string;
  endsOn: string;
  weekdays: readonly number[];
}

function parseDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isoWeekday(date: Date): number {
  return date.getUTCDay() === 0 ? 7 : date.getUTCDay();
}

export function buildScheduleDates({ startsOn, endsOn, weekdays }: ScheduleInput): string[] {
  const start = parseDate(startsOn);
  const end = parseDate(endsOn);
  if (!start || !end || !weekdays.length || end < start) return [];

  const wanted = new Set(weekdays);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < MAX_SCHEDULE_LESSONS) {
    if (wanted.has(isoWeekday(cursor))) dates.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function toMinutes(date: string, time: string): number | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "").split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return Date.UTC(year, month - 1, day, hours, minutes) / 60_000;
}

export function overlaps(startA: number, lengthA: number, startB: number, lengthB: number): boolean {
  return startA < startB + lengthB && startB < startA + lengthA;
}

export interface ConflictQuery {
  date: string;
  time: string;
  durationMinutes: number;
  excludeLessonId?: string | null;
}

export function findScheduleConflicts(
  lessons: readonly Lesson[],
  { date, time, durationMinutes, excludeLessonId = null }: ConflictQuery
): Lesson[] {
  const start = toMinutes(date, time);
  if (start === null || !durationMinutes) return [];

  return lessons.filter((lesson) => {
    if (lesson.id === excludeLessonId) return false;
    if (lesson.status === "cancelled") return false;
    const other = toMinutes(lesson.date, lesson.time);
    if (other === null) return false;
    return overlaps(start, durationMinutes, other, lesson.durationMinutes || 0);
  });
}

export function toBackendWeekdays(weekdays: readonly number[]): number[] {
  return [...weekdays].sort((a, b) => a - b).map((day) => day - 1);
}

export const MAX_SCHEDULE_WEEKS = 52;

export function weeksBetween(startsOn: string, endsOn: string): number {
  const start = parseDate(startsOn);
  const end = parseDate(endsOn);
  if (!start || !end || end < start) return 0;
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(MAX_SCHEDULE_WEEKS, Math.max(1, Math.ceil(days / 7)));
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = (time || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return time;
  const total = Math.min(23 * 60 + 59, hours * 60 + mins + (minutes || 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function findScheduleConflictsForDates(
  lessons: readonly Lesson[],
  dates: readonly string[],
  time: string,
  durationMinutes: number
): Array<{ date: string; conflicts: Lesson[] }> {
  return dates
    .map((date) => ({ date, conflicts: findScheduleConflicts(lessons, { date, time, durationMinutes }) }))
    .filter((item) => item.conflicts.length > 0);
}

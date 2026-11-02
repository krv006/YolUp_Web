import { LATE_AFTER_MINUTES } from "@/modules/attendance";
import type { Assignment, AttendanceRow, ExamSummary, Lesson } from "@/shared/types";

const DAY_MS = 86_400_000;

export type LessonOutcome =
  | { kind: "upcoming" }
  | { kind: "live"; row: AttendanceRow | null }
  | { kind: "attended"; row: AttendanceRow; lateMinutes: number }
  | { kind: "missed" };

export type DayState = "attended" | "late" | "missed" | "today" | "none";

export interface WeekDay {
  date: Date;
  state: DayState;
}

export interface WeekSummary {
  days: WeekDay[];
  total: number;
  attended: number;
  late: number;
}

export type HeroState =
  | { kind: "live"; lesson: Lesson; row: AttendanceRow | null }
  | { kind: "today"; lessons: Lesson[]; focus: Lesson }
  | { kind: "free"; next: Lesson | null };

export interface ScorePoint {
  at: number;
  score: number;
}

export type AttentionItem =
  | { kind: "homework"; assignment: Assignment }
  | { kind: "login"; at: string; device: string }
  | { kind: "exam"; exam: ExamSummary };

export interface LoginLike {
  at: string;
  device: string;
  isNewDevice: boolean;
}

export function startOfDay(value: number): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(now: number): Date {
  const date = startOfDay(now);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function childLessons(lessons: Lesson[], courseIds: ReadonlySet<string> | null): Lesson[] {
  return lessons
    .filter((lesson) => lesson.status !== "cancelled" && (!courseIds || courseIds.has(lesson.courseId)))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function rowsByLesson(rows: AttendanceRow[]): Map<string, AttendanceRow> {
  const map = new Map<string, AttendanceRow>();
  for (const row of rows) {
    const current = map.get(row.lessonId);
    if (!current || (row.joinedAt ?? "") < (current.joinedAt ?? "")) map.set(row.lessonId, row);
  }
  return map;
}

export function lessonOutcome(lesson: Lesson, row: AttendanceRow | undefined): LessonOutcome {
  if (lesson.status === "live") return { kind: "live", row: row ?? null };
  if (lesson.status !== "finished") return row?.joinedAt ? { kind: "live", row } : { kind: "upcoming" };
  if (!row?.joinedAt) return { kind: "missed" };
  const late = Math.floor((Date.parse(row.joinedAt) - Date.parse(lesson.startsAt)) / 60_000);
  return { kind: "attended", row, lateMinutes: late >= LATE_AFTER_MINUTES ? late : 0 };
}

function dayState(lessons: Lesson[], rows: Map<string, AttendanceRow>): DayState {
  const outcomes = lessons.map((lesson) => lessonOutcome(lesson, rows.get(lesson.id)));
  if (outcomes.some((item) => item.kind === "missed")) return "missed";
  if (outcomes.some((item) => item.kind === "attended" && item.lateMinutes > 0)) return "late";
  if (outcomes.some((item) => item.kind === "attended")) return "attended";
  return "none";
}

export function weekSummary(lessons: Lesson[], rows: Map<string, AttendanceRow>, now: number): WeekSummary {
  const monday = startOfWeek(now);
  const today = startOfDay(now);
  const days: WeekDay[] = [];
  let total = 0;
  let attended = 0;
  let late = 0;

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dayLessons = lessons.filter((lesson) => sameDay(new Date(lesson.startsAt), date));
    if (date.getTime() <= today.getTime()) total += dayLessons.length;
    for (const lesson of dayLessons) {
      const outcome = lessonOutcome(lesson, rows.get(lesson.id));
      if (outcome.kind === "attended") {
        attended += 1;
        if (outcome.lateMinutes > 0) late += 1;
      }
    }
    const pending = dayLessons.some((lesson) => lesson.status !== "finished");
    const state: DayState =
      date.getTime() > today.getTime()
        ? "none"
        : sameDay(date, today) && pending
          ? "today"
          : dayState(dayLessons, rows);
    days.push({ date, state });
  }

  return { days, total, attended, late };
}

export function monthAttendance(
  lessons: Lesson[],
  rows: Map<string, AttendanceRow>,
  now: number
): { percent: number | null; attended: number; total: number; delta: number | null } {
  const current = new Date(now);
  const rate = (year: number, month: number) => {
    const finished = lessons.filter((lesson) => {
      const date = new Date(lesson.startsAt);
      return lesson.status === "finished" && date.getFullYear() === year && date.getMonth() === month;
    });
    const attended = finished.filter((lesson) => rows.get(lesson.id)?.joinedAt).length;
    return { attended, total: finished.length, percent: finished.length ? Math.round((attended / finished.length) * 100) : null };
  };
  const thisMonth = rate(current.getFullYear(), current.getMonth());
  const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  const lastMonth = rate(previous.getFullYear(), previous.getMonth());
  return {
    ...thisMonth,
    delta: thisMonth.percent !== null && lastMonth.percent !== null ? thisMonth.percent - lastMonth.percent : null,
  };
}

export function weekMinutes(rows: AttendanceRow[], now: number): number {
  const monday = startOfWeek(now).getTime();
  return rows.reduce((sum, row) => {
    if (!row.joinedAt || Date.parse(row.joinedAt) < monday) return sum;
    if (row.minutes !== null) return sum + row.minutes;
    return sum + Math.max(0, Math.floor((now - Date.parse(row.joinedAt)) / 60_000));
  }, 0);
}

export function recentLessons(
  lessons: Lesson[],
  rows: Map<string, AttendanceRow>,
  now: number,
  limit = 3
): Array<{ lesson: Lesson; outcome: LessonOutcome }> {
  const tomorrow = startOfDay(now).getTime() + DAY_MS;
  return lessons
    .filter((lesson) => Date.parse(lesson.startsAt) < tomorrow)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .slice(0, limit)
    .map((lesson) => ({ lesson, outcome: lessonOutcome(lesson, rows.get(lesson.id)) }));
}

export function heroState(lessons: Lesson[], rows: Map<string, AttendanceRow>, now: number): HeroState {
  const live = lessons.find((lesson) => lesson.status === "live");
  if (live) return { kind: "live", lesson: live, row: rows.get(live.id) ?? null };
  const today = startOfDay(now);
  const todays = lessons.filter((lesson) => sameDay(new Date(lesson.startsAt), today));
  if (todays.length) {
    const focus = todays.find((lesson) => lesson.status === "scheduled") ?? todays[todays.length - 1];
    return { kind: "today", lessons: todays, focus };
  }
  return {
    kind: "free",
    next: lessons.find((lesson) => lesson.status === "scheduled" && Date.parse(lesson.startsAt) > now) ?? null,
  };
}

export function liveFocusPercent(row: AttendanceRow, now: number): number | null {
  if (!row.joinedAt) return null;
  const elapsed = (now - Date.parse(row.joinedAt)) / 1000;
  if (elapsed < 60) return null;
  return Math.max(0, Math.min(100, Math.round(100 - (row.focus.awaySeconds * 100) / elapsed)));
}

export function gradedScores(assignments: Assignment[]): ScorePoint[] {
  return assignments
    .filter((item) => item.mySubmission?.gradeValue != null && item.maxScore > 0)
    .map((item) => ({
      at: Date.parse(item.mySubmission!.createdAt),
      score: ((item.mySubmission!.gradeValue as number) / item.maxScore) * 10,
    }))
    .filter((point) => Number.isFinite(point.at));
}

function average(values: number[]): number | null {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

export function scoreSummary(points: ScorePoint[], now: number): { average: number | null; delta: number | null } {
  const recent = average(points.filter((point) => point.at > now - 30 * DAY_MS).map((point) => point.score));
  const before = average(
    points.filter((point) => point.at <= now - 30 * DAY_MS && point.at > now - 60 * DAY_MS).map((point) => point.score)
  );
  return {
    average: recent,
    delta: recent !== null && before !== null ? Math.round((recent - before) * 10) / 10 : null,
  };
}

export function scoreTrend(points: ScorePoint[], now: number, weeks = 6): Array<number | null> {
  const end = startOfWeek(now).getTime() + 7 * DAY_MS;
  return Array.from({ length: weeks }, (_, index) => {
    const to = end - (weeks - 1 - index) * 7 * DAY_MS;
    return average(points.filter((point) => point.at >= to - 7 * DAY_MS && point.at < to).map((point) => point.score));
  });
}

export function homeworkSummary(assignments: Assignment[], now: number) {
  const submitted = assignments.filter((item) => item.mySubmission).length;
  const dueSoon = assignments
    .filter((item) => {
      if (item.mySubmission || !item.dueAt) return false;
      const due = Date.parse(item.dueAt);
      return due >= now && due - now <= 2 * DAY_MS;
    })
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  return { total: assignments.length, submitted, remaining: assignments.length - submitted, dueSoon };
}

export function attentionItems({
  dueSoon,
  logins,
  exams,
  courseIds,
  now,
  limit = 3,
}: {
  dueSoon: Assignment[];
  logins: LoginLike[];
  exams: ExamSummary[];
  courseIds: ReadonlySet<string> | null;
  now: number;
  limit?: number;
}): AttentionItem[] {
  const weekAgo = now - 7 * DAY_MS;
  const items: AttentionItem[] = dueSoon.map((assignment) => ({ kind: "homework", assignment }));
  const login = logins
    .filter((record) => record.isNewDevice && Date.parse(record.at) > weekAgo)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  if (login) items.push({ kind: "login", at: login.at, device: login.device });
  for (const exam of exams) {
    const ended = Date.parse(exam.endsAt);
    if (exam.state === "finished" && ended > weekAgo && ended <= now && (!courseIds || courseIds.has(exam.courseId))) {
      items.push({ kind: "exam", exam });
    }
  }
  return items.slice(0, limit);
}

export function isInviteCode(value: string): boolean {
  return /^FK-[A-Z0-9]{4}$/i.test(value.trim());
}

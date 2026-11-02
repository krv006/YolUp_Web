import type { Assignment, AttendanceRow, Lesson } from "@/shared/types";
import { gradedScores, startOfDay, startOfWeek, type LoginLike } from "./parent-home";

const DAY_MS = 86_400_000;
const GOOD_ATTENDANCE = 80;

export type FamilyPeriod = "week" | "month";

export interface ChildPeriodSummary {
  attendance: number | null;
  homework: { submitted: number; total: number };
  score: number | null;
}

export interface CourseSchedule {
  days: number[];
  time: string;
}

function average(values: number[]): number | null {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

export function periodRange(now: number, period: FamilyPeriod): { from: number; to: number } {
  if (period === "week") {
    const from = startOfWeek(now).getTime();
    return { from, to: from + 7 * DAY_MS };
  }
  const start = startOfDay(now);
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { from: start.getTime(), to: end.getTime() };
}

export function childPeriodSummary({
  lessons,
  rows,
  assignments,
  now,
  period,
}: {
  lessons: Lesson[];
  rows: Map<string, AttendanceRow>;
  assignments: Assignment[];
  now: number;
  period: FamilyPeriod;
}): ChildPeriodSummary {
  const { from, to } = periodRange(now, period);
  const finished = lessons.filter((lesson) => {
    const at = Date.parse(lesson.startsAt);
    return lesson.status === "finished" && at >= from && at <= now;
  });
  const attended = finished.filter((lesson) => rows.get(lesson.id)?.joinedAt).length;
  const due = assignments.filter((item) => {
    if (item.status === "draft" || !item.dueAt) return false;
    const at = Date.parse(item.dueAt);
    return at >= from && at < to;
  });
  const scores = gradedScores(assignments).filter((point) => point.at >= from && point.at <= now);
  return {
    attendance: finished.length ? Math.round((attended / finished.length) * 100) : null,
    homework: { submitted: due.filter((item) => item.mySubmission).length, total: due.length },
    score: average(scores.map((point) => point.score)),
  };
}

export function attendedCount(rows: AttendanceRow[]): number {
  return new Set(rows.filter((row) => row.joinedAt).map((row) => row.lessonId)).size;
}

export function overallScore(assignments: Assignment[]): number | null {
  return average(gradedScores(assignments).map((point) => point.score));
}

export function latestVisit(rows: AttendanceRow[]): AttendanceRow | null {
  return rows.reduce<AttendanceRow | null>(
    (latest, row) => (row.joinedAt && (!latest?.joinedAt || row.joinedAt > latest.joinedAt) ? row : latest),
    null
  );
}

export function isGoodAttendance(percent: number): boolean {
  return percent >= GOOD_ATTENDANCE;
}

export function courseSchedule(lessons: Lesson[], courseId: string, now: number, horizonDays = 14): CourseSchedule | null {
  const until = now + horizonDays * DAY_MS;
  const upcoming = lessons.filter((lesson) => {
    const at = Date.parse(lesson.startsAt);
    return lesson.courseId === courseId && lesson.status === "scheduled" && at >= now && at <= until;
  });
  if (!upcoming.length) return null;
  const times = new Map<string, number>();
  const days = new Set<number>();
  for (const lesson of upcoming) {
    const date = new Date(lesson.startsAt);
    days.add((date.getDay() + 6) % 7);
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    times.set(time, (times.get(time) ?? 0) + 1);
  }
  const time = [...times.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  return { days: [...days].sort((a, b) => a - b), time };
}

export function newDeviceCount(logins: LoginLike[], now: number, days = 30): number {
  return logins.filter((record) => record.isNewDevice && Date.parse(record.at) > now - days * DAY_MS).length;
}

export function latinize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function suggestUsername(firstName: string, lastName: string): string {
  const first = latinize(firstName);
  const last = latinize(lastName);
  if (!first) return last;
  return last ? `${first}_${last[0]}` : first;
}

function digits(count: number, random: () => number): string {
  return Array.from({ length: count }, () => Math.floor(random() * 10)).join("");
}

export function usernameAlternatives(
  firstName: string,
  lastName: string,
  taken: string,
  random: () => number = Math.random
): string[] {
  const first = latinize(firstName) || "student";
  const last = latinize(lastName);
  const base = suggestUsername(firstName, lastName) || first;
  const initials = `${first[0]}${last[0] ?? ""}`;
  const options = [`${base}2`, last ? `${first}.${last}` : `${first}${digits(2, random)}`, `${initials}_${digits(3, random)}`];
  return [...new Set(options)].filter((option) => option !== taken.trim().toLowerCase());
}

export function tempPassword(firstName: string, random: () => number = Math.random): string {
  const letters = latinize(firstName).replace(/[0-9]/g, "").slice(0, 4);
  const prefix = letters ? letters[0].toUpperCase() + letters.slice(1) : "Yolup";
  return `${prefix}-${digits(Math.max(4, 7 - prefix.length), random)}`;
}

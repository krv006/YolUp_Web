import type { Assignment } from "@/shared/types";
import { gradedScores } from "./parent-home";

export interface MonthHomework {
  given: number;
  submitted: number;
  percent: number | null;
  average: number | null;
  subjects: string[];
}

export interface SubjectRow {
  courseId: string;
  title: string;
  submitted: number;
  total: number;
  average: number | null;
}

function average(values: number[]): number | null {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

function inMonth(value: string | null | undefined, year: number, month: number): boolean {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === year && date.getMonth() === month;
}

export function monthHomework(assignments: Assignment[], year: number, month: number): MonthHomework {
  const given = assignments.filter((item) => item.status !== "draft" && inMonth(item.createdAt, year, month));
  const submitted = given.filter((item) => item.mySubmission).length;
  const scores = gradedScores(assignments).filter((point) => {
    const date = new Date(point.at);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  return {
    given: given.length,
    submitted,
    percent: given.length ? Math.round((submitted / given.length) * 100) : null,
    average: average(scores.map((point) => point.score)),
    subjects: [...new Set(given.map((item) => item.courseTitle))],
  };
}

export function delta(current: number | null, previous: number | null): number | null {
  return current !== null && previous !== null ? Math.round((current - previous) * 10) / 10 : null;
}

export function subjectRows(assignments: Assignment[], titles: Map<string, string>): SubjectRow[] {
  const byCourse = new Map<string, Assignment[]>();
  for (const item of assignments) {
    if (item.status === "draft") continue;
    byCourse.set(item.courseId, [...(byCourse.get(item.courseId) ?? []), item]);
  }
  for (const courseId of titles.keys()) if (!byCourse.has(courseId)) byCourse.set(courseId, []);
  return [...byCourse.entries()]
    .map(([courseId, items]) => ({
      courseId,
      title: titles.get(courseId) ?? items[0]?.courseTitle ?? "",
      submitted: items.filter((item) => item.mySubmission).length,
      total: items.length,
      average: average(gradedScores(items).map((point) => point.score)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function recentGrades(assignments: Assignment[], limit = 3): Assignment[] {
  return assignments
    .filter((item) => item.mySubmission?.gradeValue != null)
    .sort((a, b) =>
      (b.mySubmission?.checkedAt ?? b.mySubmission?.createdAt ?? "").localeCompare(a.mySubmission?.checkedAt ?? a.mySubmission?.createdAt ?? "")
    )
    .slice(0, limit);
}

export function activeMonths(assignments: Assignment[], now: number): Array<{ year: number; month: number }> {
  const keys = new Set<string>();
  const current = new Date(now);
  keys.add(`${current.getFullYear()}-${current.getMonth()}`);
  for (const item of assignments) {
    const date = new Date(item.createdAt);
    if (!Number.isNaN(date.getTime())) keys.add(`${date.getFullYear()}-${date.getMonth()}`);
  }
  return [...keys]
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

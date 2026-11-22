import { describe, expect, it } from "vitest";
import type { Assignment } from "@/shared/types";
import { activeMonths, delta, monthHomework, recentGrades, subjectRows } from "./parent-results";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, month = 9) => new Date(2026, month, day, 12).toISOString();
const graded = (day: number, value: number, month = 9) =>
  ({ createdAt: at(day, month), checkedAt: at(day + 1, month), gradeValue: value }) as Assignment["mySubmission"];
const assignment = (id: string, courseId: string, createdAt: string, mySubmission: Assignment["mySubmission"] = null) =>
  ({ id, courseId, courseTitle: courseId === "c1" ? "Ingliz tili A1" : "Matematika", createdAt, maxScore: 10, status: "published", mySubmission }) as unknown as Assignment;

const items = [
  assignment("a", "c1", at(3), graded(5, 9)),
  assignment("b", "c1", at(10), graded(12, 8)),
  assignment("c", "c2", at(20)),
  assignment("d", "c1", at(15, 8), graded(16, 7, 8)),
];

describe("monthHomework", () => {
  it("summarises assignments given in a month", () => {
    expect(monthHomework(items, 2026, 9)).toEqual({
      given: 3,
      submitted: 2,
      percent: 67,
      average: 8.5,
      subjects: ["Ingliz tili A1", "Matematika"],
    });
    expect(monthHomework(items, 2026, 8)).toMatchObject({ given: 1, submitted: 1, percent: 100, average: 7 });
    expect(delta(8.5, 7)).toBe(1.5);
    expect(delta(null, 7)).toBeNull();
  });
});

describe("subjectRows and recentGrades", () => {
  it("groups by course and keeps empty courses", () => {
    expect(subjectRows(items, new Map([["c1", "Ingliz tili A1"], ["c2", "Matematika"], ["c3", "Fizika"]]))).toEqual([
      { courseId: "c3", title: "Fizika", submitted: 0, total: 0, average: null },
      { courseId: "c1", title: "Ingliz tili A1", submitted: 3, total: 3, average: 8 },
      { courseId: "c2", title: "Matematika", submitted: 0, total: 1, average: null },
    ]);
    expect(recentGrades(items, 2).map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("lists months with homework plus the current one", () => {
    expect(activeMonths(items, NOW)).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 8 },
    ]);
  });
});

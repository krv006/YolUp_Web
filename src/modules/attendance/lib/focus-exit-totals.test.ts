import { describe, expect, it } from "vitest";
import type { AttendanceRow } from "@/shared/types";
import { focusExitTotals } from "./focus-exit-totals";

const row = (lessonId: string, studentId: string, exits: number) =>
  ({ id: `${lessonId}-${studentId}`, lessonId, studentId, focus: { exits } }) as AttendanceRow;

const rows = [row("l1", "s1", 2), row("l1", "s2", 1), row("l2", "s1", 3), row("l3", "s2", 4)];

describe("focusExitTotals", () => {
  it("sums window exits per lesson and per student", () => {
    const totals = focusExitTotals(rows);
    expect(Object.fromEntries(totals.byLesson)).toEqual({ l1: 3, l2: 3, l3: 4 });
    expect(Object.fromEntries(totals.byStudent)).toEqual({ s1: 5, s2: 5 });
  });

  it("counts only the lessons shown for the chosen period", () => {
    const totals = focusExitTotals(rows, new Set(["l1", "l2"]));
    expect(Object.fromEntries(totals.byStudent)).toEqual({ s1: 5, s2: 1 });
    expect(totals.byLesson.has("l3")).toBe(false);
  });
});

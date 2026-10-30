import { describe, expect, it } from "vitest";
import type { AttendanceRow, DomainUser } from "@/shared/types";
import { averageFocus, buildLessonRoster } from "./lesson-roster";

const start = "2026-10-29T14:00:00+05:00";
const at = (minutes: number) => new Date(Date.parse(start) + minutes * 60_000).toISOString();
const user = (id: string, name: string): DomainUser => ({ id, username: id, name });
const row = (studentId: string, joinedMinute: number, patch: Partial<AttendanceRow> = {}) =>
  ({
    id: `a-${studentId}-${joinedMinute}`,
    lessonId: "l1",
    studentId,
    student: user(studentId, studentId),
    joinedAt: at(joinedMinute),
    leftAt: at(45),
    focusPercent: 90,
    ...patch,
  }) as AttendanceRow;

describe("buildLessonRoster", () => {
  const students = [user("s1", "Bekzod"), user("s2", "Madina"), user("s3", "Nilufar")];

  it("marks present, late and absent students", () => {
    const roster = buildLessonRoster([row("s1", 1), row("s2", 12)], students, start, false);
    expect(roster.map((entry) => [entry.student.name, entry.status])).toEqual([
      ["Bekzod", "present"],
      ["Madina", "late"],
      ["Nilufar", "absent"],
    ]);
    expect(roster[1].lateMinutes).toBe(12);
  });

  it("shows students still in a live lesson", () => {
    const roster = buildLessonRoster([row("s1", 0, { leftAt: null })], students, start, true);
    expect(roster[0].status).toBe("inLesson");
  });

  it("keeps the first join when a student rejoined", () => {
    const roster = buildLessonRoster([row("s1", 2), row("s1", 20)], students, start, false);
    expect(roster.find((entry) => entry.student.id === "s1")?.status).toBe("present");
  });

  it("includes attendees who already left the group", () => {
    const roster = buildLessonRoster([row("s9", 0)], students, start, false);
    expect(roster.map((entry) => entry.student.id)).toContain("s9");
  });
});

describe("averageFocus", () => {
  it("ignores rows without a focus value", () => {
    expect(averageFocus([row("s1", 0, { focusPercent: 80 }), row("s2", 0, { focusPercent: null }), row("s3", 0, { focusPercent: 91 })])).toBe(86);
    expect(averageFocus([row("s1", 0, { focusPercent: null })])).toBeNull();
  });
});

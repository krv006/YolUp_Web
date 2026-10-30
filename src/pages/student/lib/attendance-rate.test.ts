import { describe, expect, it } from "vitest";
import type { Lesson } from "@/shared/types";
import { monthAttendanceRate } from "./attendance-rate";

const lesson = (startsAt: string, status: Lesson["status"], attended: boolean | null) =>
  ({ id: startsAt, startsAt, status, attended }) as Lesson;

describe("monthAttendanceRate", () => {
  const now = new Date("2026-10-29T12:00:00");

  it("counts only finished lessons of the current month", () => {
    const lessons = [
      lesson("2026-10-02T10:00:00", "finished", true),
      lesson("2026-10-09T10:00:00", "finished", false),
      lesson("2026-10-16T10:00:00", "finished", true),
      lesson("2026-10-30T10:00:00", "scheduled", null),
      lesson("2026-09-25T10:00:00", "finished", false),
    ];
    expect(monthAttendanceRate(lessons, now)).toBe(67);
  });

  it("returns null when nothing finished this month", () => {
    expect(monthAttendanceRate([lesson("2026-10-30T10:00:00", "scheduled", null)], now)).toBeNull();
  });
});

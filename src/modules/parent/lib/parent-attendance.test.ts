import { describe, expect, it } from "vitest";
import type { AttendanceRow, Lesson } from "@/shared/types";
import {
  attendanceEntries,
  attendanceStats,
  dayStatus,
  entriesByDay,
  exitSegments,
  filterEntries,
  monthGrid,
  monthsWithLessons,
  rowFocus,
  toCsv,
  type AttendanceStatus,
} from "./parent-attendance";
import { rowsByLesson } from "./parent-home";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, hour: number, minute = 0, month = 9) => new Date(2026, month, day, hour, minute).toISOString();
const lesson = (id: string, startsAt: string, status: Lesson["status"], courseId = "c1", courseTitle = "Ingliz tili A1") =>
  ({ id, startsAt, status, courseId, courseTitle, title: "", durationMinutes: 90 }) as Lesson;
const row = (lessonId: string, joinedAt: string | null, patch: Partial<AttendanceRow> = {}) =>
  ({
    id: `a-${lessonId}`,
    lessonId,
    joinedAt,
    leftAt: null,
    minutes: 90,
    focusPercent: null,
    focus: { exits: 0, awaySeconds: 0, longestSeconds: 0, timeline: [], alert: false },
    ...patch,
  }) as AttendanceRow;
const ALL = new Set<AttendanceStatus>(["attended", "late", "missed", "upcoming"]);

const lessons = [
  lesson("live", at(29, 14), "live"),
  lesson("wed", at(28, 18), "finished", "c2", "Matematika · Olimpiada"),
  lesson("tue", at(27, 16), "finished"),
  lesson("fri", at(24, 16), "finished"),
  lesson("old", at(22, 16), "finished"),
  lesson("next", at(31, 10), "scheduled"),
];
const rows = rowsByLesson([
  row("live", at(29, 14, 15), { minutes: null }),
  row("wed", at(28, 18, 2), { focusPercent: 86 }),
  row("tue", at(27, 16, 12), { focus: { exits: 1, awaySeconds: 1080, longestSeconds: 1080, timeline: [], alert: false } }),
  row("old", at(22, 15, 58), { focusPercent: 91 }),
]);
const entries = attendanceEntries(lessons, rows);

describe("attendanceEntries", () => {
  it("classifies lessons newest first", () => {
    expect(entries.map((entry) => [entry.lesson.id, entry.status])).toEqual([
      ["next", "upcoming"],
      ["live", "live"],
      ["wed", "attended"],
      ["tue", "late"],
      ["fri", "missed"],
      ["old", "attended"],
    ]);
    expect(entries.find((entry) => entry.lesson.id === "tue")?.lateMinutes).toBe(12);
  });

  it("takes the server focus or derives it from time away", () => {
    expect(rowFocus(rows.get("wed") ?? null)).toBe(86);
    expect(rowFocus(rows.get("tue") ?? null)).toBe(80);
    expect(rowFocus(null)).toBeNull();
  });
});

describe("filters and stats", () => {
  it("filters by period, course, status and text", () => {
    const base = { period: "week" as const, courseId: null, statuses: ALL, query: "" };
    expect(filterEntries(entries, base, NOW).map((entry) => entry.lesson.id)).toEqual(["next", "live", "wed", "tue"]);
    expect(filterEntries(entries, { ...base, period: "month", courseId: "c2" }, NOW).map((entry) => entry.lesson.id)).toEqual(["wed"]);
    expect(
      filterEntries(entries, { ...base, period: "all", statuses: new Set<AttendanceStatus>(["missed"]) }, NOW).map((entry) => entry.lesson.id)
    ).toEqual(["fri"]);
    expect(filterEntries(entries, { ...base, period: "all", query: "olimp" }, NOW).map((entry) => entry.lesson.id)).toEqual(["wed"]);
  });

  it("counts outcomes, average focus and the best weekday", () => {
    expect(attendanceStats(entries)).toEqual({
      attended: 2,
      late: 1,
      missed: 1,
      percent: 75,
      averageFocus: 86,
      bestWeekday: 3,
    });
    expect(attendanceStats([])).toMatchObject({ percent: null, averageFocus: null, bestWeekday: null });
  });
});

describe("calendar helpers", () => {
  it("builds a Monday-first month grid", () => {
    const grid = monthGrid(2026, 9);
    expect(grid).toHaveLength(35);
    expect(grid[0].getDate()).toBe(28);
    expect(grid[3].getDate()).toBe(1);
    expect(grid[34].getDate()).toBe(1);
  });

  it("picks the most important status of a day", () => {
    const byDay = entriesByDay(entries);
    expect(dayStatus(byDay.get("2026-9-24"))).toBe("missed");
    expect(dayStatus(byDay.get("2026-9-27"))).toBe("late");
    expect(dayStatus(byDay.get("2026-9-31"))).toBe("upcoming");
    expect(dayStatus(undefined)).toBeNull();
  });

  it("lists months that had lessons", () => {
    expect(monthsWithLessons(entries, NOW)).toEqual([{ year: 2026, month: 9, count: 5 }]);
  });
});

describe("exitSegments", () => {
  it("splits the stay into focused and away parts", () => {
    const entry = attendanceEntries(
      [lesson("x", at(28, 18), "finished")],
      rowsByLesson([
        row("x", at(28, 18), {
          leftAt: at(28, 19, 40),
          minutes: 100,
          focus: { exits: 1, awaySeconds: 600, longestSeconds: 600, alert: false, timeline: [{ leftAt: at(28, 18, 50), returnedAt: at(28, 19), seconds: 600 }] },
        }),
      ])
    )[0];
    expect(exitSegments(entry)).toEqual([
      { from: 0, to: 0.5, away: false },
      { from: 0.5, to: 0.6, away: true },
      { from: 0.6, to: 1, away: false },
    ]);
  });
});

describe("toCsv", () => {
  it("quotes cells and adds a BOM for Excel", () => {
    expect(toCsv([["Dars", "Izoh"], ["Ingliz; A1", 'Dedi "salom"']])).toBe('\uFEFFDars;Izoh\r\n"Ingliz; A1";"Dedi ""salom"""');
  });
});

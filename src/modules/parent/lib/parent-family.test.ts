import { describe, expect, it } from "vitest";
import type { Assignment, AttendanceRow, Lesson } from "@/shared/types";
import {
  attendedCount,
  childPeriodSummary,
  courseSchedule,
  latestVisit,
  newDeviceCount,
  overallScore,
  periodRange,
  recentUnlink,
  suggestUsername,
  tempPassword,
  usernameAlternatives,
} from "./parent-family";
import { rowsByLesson } from "./parent-home";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, hour: number, minute = 0, month = 9) => new Date(2026, month, day, hour, minute).toISOString();
const lesson = (id: string, startsAt: string, status: Lesson["status"], courseId = "c1") =>
  ({ id, startsAt, status, courseId, courseTitle: "Ingliz tili A1", durationMinutes: 90 }) as Lesson;
const row = (lessonId: string, joinedAt: string | null) => ({ id: `a-${lessonId}`, lessonId, joinedAt }) as AttendanceRow;
const assignment = (id: string, patch: Partial<Assignment>) =>
  ({ id, title: id, maxScore: 10, dueAt: null, mySubmission: null, status: "published", courseId: "c1", ...patch }) as Assignment;
const graded = (day: number, value: number) => ({ createdAt: at(day, 12), gradeValue: value }) as Assignment["mySubmission"];
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length];
};

describe("periodRange", () => {
  it("covers Monday to Monday for a week and the calendar month", () => {
    expect(periodRange(NOW, "week")).toEqual({ from: new Date(2026, 9, 26).getTime(), to: new Date(2026, 10, 2).getTime() });
    expect(periodRange(NOW, "month")).toEqual({ from: new Date(2026, 9, 1).getTime(), to: new Date(2026, 10, 1).getTime() });
  });
});

describe("childPeriodSummary", () => {
  const lessons = [
    lesson("mon", at(26, 16), "finished"),
    lesson("tue", at(27, 16), "finished"),
    lesson("wed", at(28, 18), "finished"),
    lesson("fri", at(30, 16), "scheduled"),
    lesson("early", at(5, 16), "finished"),
  ];
  const rows = rowsByLesson([row("mon", at(26, 16)), row("wed", at(28, 18, 3)), row("early", at(5, 16))]);
  const assignments = [
    assignment("done", { dueAt: at(28, 23), mySubmission: graded(27, 9) }),
    assignment("open", { dueAt: at(31, 23) }),
    assignment("old", { dueAt: at(10, 23), mySubmission: graded(9, 7) }),
    assignment("draft", { dueAt: at(29, 23), status: "draft" }),
  ];

  it("summarises this week", () => {
    expect(childPeriodSummary({ lessons, rows, assignments, now: NOW, period: "week" })).toEqual({
      attendance: 67,
      homework: { submitted: 1, total: 2 },
      score: 9,
    });
  });

  it("summarises this month", () => {
    expect(childPeriodSummary({ lessons, rows, assignments, now: NOW, period: "month" })).toEqual({
      attendance: 75,
      homework: { submitted: 2, total: 3 },
      score: 8,
    });
  });

  it("reports nothing for an empty period", () => {
    expect(childPeriodSummary({ lessons: [], rows: new Map(), assignments: [], now: NOW, period: "week" })).toEqual({
      attendance: null,
      homework: { submitted: 0, total: 0 },
      score: null,
    });
  });
});

describe("card figures", () => {
  it("counts attended lessons once, averages all grades and finds the latest visit", () => {
    const rows = [row("a", at(26, 16)), row("a", at(26, 16, 30)), row("b", null), row("c", at(28, 18))];
    expect(attendedCount(rows)).toBe(2);
    expect(latestVisit(rows)?.lessonId).toBe("c");
    expect(latestVisit([row("x", null)])).toBeNull();
    expect(overallScore([assignment("a", { mySubmission: graded(1, 9) }), assignment("b", { mySubmission: graded(2, 16), maxScore: 20 })])).toBe(8.5);
    expect(overallScore([])).toBeNull();
  });
});

describe("courseSchedule", () => {
  it("collects weekdays and the usual start time of upcoming lessons", () => {
    const lessons = [
      lesson("a", at(30, 16), "scheduled"),
      lesson("b", at(2, 16, 0, 10), "scheduled"),
      lesson("c", at(4, 16, 0, 10), "scheduled"),
      lesson("d", at(5, 18, 0, 10), "scheduled"),
      lesson("e", at(31, 9), "scheduled", "c2"),
      lesson("f", at(28, 16), "finished"),
    ];
    expect(courseSchedule(lessons, "c1", NOW)).toEqual({ days: [0, 2, 3, 4], time: "16:00" });
    expect(courseSchedule(lessons, "c9", NOW)).toBeNull();
  });
});

describe("newDeviceCount", () => {
  it("counts new devices in the last 30 days", () => {
    const logins = [
      { at: at(28, 9), device: "Chrome", isNewDevice: true },
      { at: at(27, 9), device: "Safari", isNewDevice: false },
      { at: at(1, 9, 0, 8), device: "Old", isNewDevice: true },
    ];
    expect(newDeviceCount(logins, NOW)).toBe(1);
  });
});

describe("child account helpers", () => {
  it("builds a login from the name", () => {
    expect(suggestUsername("Toshmat", "Boltayev")).toBe("toshmat_b");
    expect(suggestUsername("G‘ulomjon", "")).toBe("gulomjon");
    expect(suggestUsername("", "Boltayev")).toBe("boltayev");
  });

  it("offers alternatives when the login is taken", () => {
    expect(usernameAlternatives("Toshmat", "Boltayev", "toshmat_b", sequence(0.2, 0.0, 0.1))).toEqual([
      "toshmat_b2",
      "toshmat.boltayev",
      "tb_201",
    ]);
    expect(usernameAlternatives("Toshmat", "Boltayev", "toshmat_b2", sequence(0.5))).not.toContain("toshmat_b2");
  });

  it("makes a temporary password of at least 8 characters", () => {
    expect(tempPassword("Toshmat", sequence(0.4, 0.8, 0.2, 0.1))).toBe("Tosh-4821");
    expect(tempPassword("Al", sequence(0.1))).toBe("Al-11111");
    expect(tempPassword("", sequence(0.3))).toBe("Yolup-3333");
    for (const name of ["A", "Ali", "Toshmat", "Ёқубжон", ""]) expect(tempPassword(name).length).toBeGreaterThanOrEqual(8);
  });
});

describe("recentUnlink", () => {
  const link = (id: string, status: string, studentId: string, respondedAt: string | null) => ({ id, status, studentId, respondedAt });

  it("returns the newest recent decline that was not seen yet", () => {
    const links = [
      link("old", "declined", "s3", at(10, 9)),
      link("new", "declined", "s2", at(28, 9)),
      link("ok", "approved", "s1", at(1, 9)),
      link("again", "declined", "s1", at(29, 9)),
    ];
    expect(recentUnlink(links, new Set(["s1"]), new Set(), NOW)?.id).toBe("new");
    expect(recentUnlink(links, new Set(["s1"]), new Set(["new"]), NOW)).toBeNull();
    expect(recentUnlink([link("pending", "declined", "s4", null)], new Set(), new Set(), NOW)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import type { Assignment, AttendanceRow, ExamSummary, Lesson } from "@/shared/types";
import {
  attentionItems,
  childLessons,
  gradedScores,
  heroState,
  homeworkSummary,
  isInviteCode,
  lessonOutcome,
  liveFocusPercent,
  monthAttendance,
  recentLessons,
  rowsByLesson,
  scoreSummary,
  scoreTrend,
  weekMinutes,
  weekSummary,
} from "./parent-home";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
const lesson = (id: string, startsAt: string, status: Lesson["status"], courseId = "c1") =>
  ({ id, startsAt, status, courseId, courseTitle: "Ingliz tili A1", durationMinutes: 90 }) as Lesson;
const row = (lessonId: string, joinedAt: string | null, patch: Partial<AttendanceRow> = {}) =>
  ({
    id: `a-${lessonId}`,
    lessonId,
    joinedAt,
    leftAt: joinedAt,
    minutes: 60,
    attentionAnswered: 3,
    attentionTotal: 3,
    focus: { exits: 0, awaySeconds: 0, longestSeconds: 0, timeline: [], alert: false },
    focusPercent: 100,
    ...patch,
  }) as AttendanceRow;

describe("lesson outcomes", () => {
  it("marks attended, late, missed, live and upcoming lessons", () => {
    expect(lessonOutcome(lesson("l1", at(28, 18), "finished"), row("l1", at(28, 18, 2)))).toMatchObject({ kind: "attended", lateMinutes: 0 });
    expect(lessonOutcome(lesson("l2", at(27, 16), "finished"), row("l2", at(27, 16, 12)))).toMatchObject({ kind: "attended", lateMinutes: 12 });
    expect(lessonOutcome(lesson("l3", at(26, 16), "finished"), undefined)).toEqual({ kind: "missed" });
    expect(lessonOutcome(lesson("l4", at(29, 14), "live"), undefined)).toEqual({ kind: "live", row: null });
    expect(lessonOutcome(lesson("l5", at(29, 16), "scheduled"), undefined)).toEqual({ kind: "upcoming" });
  });

  it("keeps the first join when a student rejoined", () => {
    const map = rowsByLesson([row("l1", at(28, 18, 30)), row("l1", at(28, 18, 1))]);
    expect(map.get("l1")?.joinedAt).toBe(at(28, 18, 1));
  });
});

describe("weekSummary", () => {
  it("builds the Monday-to-Sunday strip like the design", () => {
    const lessons = [
      lesson("mon", at(26, 16), "finished"),
      lesson("tue", at(27, 16), "finished"),
      lesson("wed", at(28, 18), "finished"),
      lesson("thu", at(29, 16), "scheduled"),
      lesson("fri", at(30, 16), "scheduled"),
    ];
    const rows = rowsByLesson([row("mon", at(26, 16)), row("tue", at(27, 16, 1)), row("wed", at(28, 18, 12))]);
    const week = weekSummary(lessons, rows, NOW);
    expect(week.days.map((day) => day.state)).toEqual(["attended", "attended", "late", "today", "none", "none", "none"]);
    expect(week).toMatchObject({ total: 4, attended: 3, late: 1 });
  });
});

describe("monthAttendance", () => {
  it("counts finished lessons of this month and compares with last month", () => {
    const lessons = [
      lesson("o1", at(2, 16), "finished"),
      lesson("o2", at(9, 16), "finished"),
      lesson("o3", at(16, 16), "finished"),
      lesson("o4", at(23, 16), "finished"),
      lesson("s1", new Date(2026, 8, 10, 16).toISOString(), "finished"),
      lesson("s2", new Date(2026, 8, 17, 16).toISOString(), "finished"),
    ];
    const rows = rowsByLesson([row("o1", at(2, 16)), row("o2", at(9, 16)), row("o3", at(16, 16)), row("s1", new Date(2026, 8, 10, 16).toISOString())]);
    expect(monthAttendance(lessons, rows, NOW)).toEqual({ percent: 75, attended: 3, total: 4, delta: 25 });
  });
});

describe("time and hero", () => {
  it("adds this week's minutes including a lesson in progress", () => {
    const rows = [row("a", at(27, 16)), row("b", at(29, 14, 15), { minutes: null, leftAt: null }), row("old", at(20, 16))];
    expect(weekMinutes(rows, NOW)).toBe(60 + 24);
  });

  it("prefers a live lesson, then today's next lesson, then the next day", () => {
    const live = lesson("live", at(29, 14), "live");
    const later = lesson("later", at(29, 16), "scheduled");
    const tomorrow = lesson("tomorrow", at(30, 16), "scheduled");
    expect(heroState([live, later], new Map(), NOW)).toMatchObject({ kind: "live", lesson: live });
    expect(heroState([later, tomorrow], new Map(), NOW)).toMatchObject({ kind: "today", focus: later });
    expect(heroState([tomorrow], new Map(), NOW)).toEqual({ kind: "free", next: tomorrow });
  });

  it("estimates live focus from time spent away", () => {
    const live = row("l", at(29, 14, 15), { focusPercent: null, focus: { exits: 1, awaySeconds: 200, longestSeconds: 200, timeline: [], alert: false } });
    expect(liveFocusPercent(live, NOW)).toBe(86);
    expect(liveFocusPercent(row("l", null), NOW)).toBeNull();
    expect(liveFocusPercent(row("l", at(29, 14, 15), { focusPercent: 72.4 }), NOW)).toBe(72);
  });

  it("lists today's and past lessons newest first", () => {
    const lessons = childLessons(
      [lesson("a", at(27, 16), "finished"), lesson("b", at(29, 16), "scheduled"), lesson("c", at(30, 16), "scheduled"), lesson("d", at(28, 18), "finished"), lesson("x", at(28, 9), "cancelled")],
      null
    );
    expect(recentLessons(lessons, new Map(), NOW).map((item) => item.lesson.id)).toEqual(["b", "d", "a"]);
  });

  it("keeps only the selected child's courses", () => {
    expect(childLessons([lesson("a", at(27, 16), "finished", "c1"), lesson("b", at(27, 17), "finished", "c2")], new Set(["c2"])).map((item) => item.id)).toEqual(["b"]);
  });
});

const assignment = (id: string, patch: Partial<Assignment>) => ({ id, title: id, maxScore: 10, dueAt: null, mySubmission: null, courseId: "c1", ...patch }) as Assignment;
const graded = (day: number, value: number) => ({ createdAt: at(day, 12), gradeValue: value }) as Assignment["mySubmission"];

describe("homework and scores", () => {
  it("normalises grades to a 10 point scale and compares 30 day windows", () => {
    const points = gradedScores([
      assignment("a", { mySubmission: graded(25, 9) }),
      assignment("b", { mySubmission: graded(20, 16), maxScore: 20 }),
      assignment("c", { mySubmission: { createdAt: at(10, 12), gradeValue: 70 } as Assignment["mySubmission"], maxScore: 100 }),
      assignment("d", { mySubmission: { createdAt: at(18, 12), gradeValue: null } as Assignment["mySubmission"] }),
    ]);
    expect(points.map((point) => point.score)).toEqual([9, 8, 7]);
    const early = { at: new Date(2026, 8, 20).getTime(), score: 7.5 };
    expect(scoreSummary([...points, early], NOW)).toEqual({ average: 8, delta: 0.5 });
    expect(scoreTrend(points, NOW)).toEqual([null, null, 7, null, 8.5, null]);
  });

  it("counts remaining homework and what is due within two days", () => {
    const summary = homeworkSummary(
      [
        assignment("done", { mySubmission: graded(25, 9) }),
        assignment("soon", { dueAt: at(31, 23, 59) }),
        assignment("later", { dueAt: at(31 + 5, 12) }),
        assignment("late", { dueAt: at(27, 12) }),
      ],
      NOW
    );
    expect(summary).toMatchObject({ total: 4, submitted: 1, remaining: 3 });
    expect(summary.dueSoon.map((item) => item.id)).toEqual([]);
    expect(homeworkSummary([assignment("soon", { dueAt: at(30, 23, 59) })], NOW).dueSoon.map((item) => item.id)).toEqual(["soon"]);
  });
});

describe("attentionItems", () => {
  it("collects due homework, a new device login and fresh mock results", () => {
    const exam = { id: "e1", state: "finished", endsAt: at(28, 12), courseId: "c1", title: "IELTS mock" } as ExamSummary;
    const items = attentionItems({
      dueSoon: [assignment("soon", { dueAt: at(30, 23) })],
      logins: [
        { at: at(29, 15, 7), device: "Chrome · Android", isNewDevice: true },
        { at: at(29, 9), device: "Safari · iPhone", isNewDevice: false },
      ],
      exams: [exam, { ...exam, id: "other", courseId: "c9" }],
      courseIds: new Set(["c1"]),
      now: NOW,
    });
    expect(items.map((item) => item.kind)).toEqual(["homework", "login", "exam"]);
    expect(items[1]).toMatchObject({ device: "Chrome · Android" });
  });
});

describe("isInviteCode", () => {
  it("tells an invite code from a login", () => {
    expect(isInviteCode("FK-7Q2D")).toBe(true);
    expect(isInviteCode(" fk-a1b2 ")).toBe(true);
    expect(isInviteCode("student1")).toBe(false);
  });
});

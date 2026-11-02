import { describe, expect, it } from "vitest";
import type { Assignment } from "@/shared/types";
import { countdown, homeworkState, homeworkStats, scoreDelta, splitHomework } from "./parent-homework";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
const submission = (status: string, day: number, gradeValue: number | null = null) =>
  ({ status, createdAt: at(day, 19, 40), gradeValue }) as unknown as Assignment["mySubmission"];
const assignment = (id: string, patch: Partial<Assignment>) =>
  ({ id, title: id, maxScore: 10, dueAt: null, mySubmission: null, status: "published", ...patch }) as Assignment;

const items = [
  assignment("present", { dueAt: at(31, 23, 59) }),
  assignment("reading", { dueAt: at(27, 23, 59) }),
  assignment("essay", { dueAt: at(31, 23, 59), mySubmission: submission("pending_review", 28) }),
  assignment("vocab", { dueAt: at(26, 23, 59), mySubmission: submission("done", 26, 9) }),
  assignment("listening", { mySubmission: submission("done", 22, 7.5) }),
  assignment("physics", { mySubmission: submission("error", 26) }),
  assignment("redo", { mySubmission: submission("resubmit_requested", 20) }),
  assignment("draft", { status: "draft" as Assignment["status"] }),
];

describe("homeworkState", () => {
  it("maps submissions to parent-facing states", () => {
    expect(items.map((item) => homeworkState(item, NOW))).toEqual([
      "pending",
      "overdue",
      "checking",
      "graded",
      "graded",
      "error",
      "resubmit",
      "pending",
    ]);
    expect(homeworkState(assignment("ungraded", { mySubmission: submission("done", 25) }), NOW)).toBe("done");
  });
});

describe("splitHomework", () => {
  it("puts open work first (overdue last) and submitted work newest first", () => {
    const { waiting, submitted } = splitHomework(items, "all", NOW);
    expect(waiting.map((item) => item.id)).toEqual(["present", "redo", "reading"]);
    expect(submitted.map((item) => item.id)).toEqual(["essay", "vocab", "physics", "listening"]);
    expect(splitHomework(items, "graded", NOW).submitted.map((item) => item.id)).toEqual(["vocab", "listening"]);
    expect(splitHomework(items, "waiting", NOW).submitted).toEqual([]);
  });
});

describe("homeworkStats and helpers", () => {
  it("counts waiting and checking work and averages grades", () => {
    expect(homeworkStats(items, NOW)).toEqual({ waiting: 3, checking: 2, average: 8.3 });
  });

  it("counts down to the deadline", () => {
    expect(countdown(at(31, 23, 59), NOW)).toEqual({ days: 2, hours: 9, minutes: 20 });
    expect(countdown(at(20, 10), NOW)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it("compares a grade with the previous one", () => {
    const vocab = items.find((item) => item.id === "vocab") as Assignment;
    expect(scoreDelta(vocab, items)).toBe(1.5);
    expect(scoreDelta(items[0], items)).toBeNull();
  });
});

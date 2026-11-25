import { describe, expect, it } from "vitest";
import type { QuizSummary } from "@/shared/types";
import { isQuizEvent, quizEventId, quizEvents } from "./quiz-events";

const quiz = (patch: Partial<QuizSummary>) =>
  ({ id: "q1", courseId: "c1", title: "Kasrlar", topic: "", status: "published", opensAt: null, dueAt: null, createdAt: "", ...patch }) as QuizSummary;

const options = { courseTitle: () => "Math 2", label: (title: string) => `Test: ${title}`, now: new Date("2026-11-25T12:00:00+05:00") };

describe("quizEvents", () => {
  it("places an assigned test at its opening time, or at its deadline when it has none", () => {
    const [opening] = quizEvents([quiz({ opensAt: "2026-11-26T09:00:00+05:00", dueAt: "2026-11-27T23:59:00+05:00" })], options);
    expect(opening).toMatchObject({ date: "2026-11-26", time: "09:00", title: "Test: Kasrlar", courseTitle: "Math 2", status: "scheduled" });
    expect(isQuizEvent(opening)).toBe(true);
    expect(quizEventId(opening)).toBe("q1");
    expect(quizEvents([quiz({ dueAt: "2026-11-24T23:59:00+05:00" })], options)[0]).toMatchObject({ time: "23:59", status: "finished" });
  });

  it("skips drafts, tests without a group and tests without any time", () => {
    expect(quizEvents([quiz({ status: "draft", dueAt: "2026-11-26T09:00:00+05:00" }), quiz({ courseId: "", dueAt: "2026-11-26T09:00:00+05:00" }), quiz({})], options)).toEqual([]);
  });
});

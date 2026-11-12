import { describe, expect, it } from "vitest";
import { mapQuizDto, mapQuizSummaryDto } from "./quiz.mappers";

const summary = {
  id: "q1",
  course: "c1",
  lesson: null,
  title: "Kasrlar",
  due_at: null,
  opens_at: null,
  question_count: 30,
  created_at: "2026-11-12T09:00:00Z",
};

describe("student quiz state", () => {
  it("reads attempts and the running session from the list", () => {
    expect(
      mapQuizSummaryDto({ ...summary, attempts_used: 1, attempts_left: 0, session_ends_at: "2026-11-12T10:20:00Z" })
    ).toMatchObject({ attemptsUsed: 1, attemptsLeft: 0, sessionEndsAt: "2026-11-12T10:20:00Z" });
  });

  it("keeps the fields empty for teachers and older answers", () => {
    expect(mapQuizSummaryDto(summary)).toMatchObject({ attemptsUsed: null, attemptsLeft: null, sessionEndsAt: null });
  });

  it("takes the attempt's question count before the test is started", () => {
    const quiz = mapQuizDto({ ...summary, question_count: 10, questions_per_attempt: 10, needs_start: true, questions: [] });
    expect(quiz).toMatchObject({ needsStart: true, questionCount: 10 });
  });
});

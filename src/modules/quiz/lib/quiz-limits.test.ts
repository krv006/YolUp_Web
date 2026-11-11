import { describe, expect, it } from "vitest";
import { parseQuizLimits, quizLimitsDraft } from "./quiz-limits";

const quiz = { questionCount: 30, hasGroups: false };

describe("quiz limits", () => {
  it("treats empty fields as no limit", () => {
    expect(parseQuizLimits({ time: "", attempts: " ", perAttempt: "" }, quiz)).toEqual({
      limits: { timeLimitMinutes: null, maxAttempts: null, questionsPerAttempt: null },
      invalid: [],
    });
  });

  it("keeps values inside the backend ranges", () => {
    const parsed = parseQuizLimits({ time: "20", attempts: "2", perAttempt: "10" }, quiz);
    expect(parsed.limits).toEqual({ timeLimitMinutes: 20, maxAttempts: 2, questionsPerAttempt: 10 });
    expect(parseQuizLimits({ time: "601", attempts: "21", perAttempt: "31" }, quiz).invalid).toEqual([
      "time",
      "attempts",
      "perAttempt",
    ]);
    expect(parseQuizLimits({ time: "1.5", attempts: "0", perAttempt: "abc" }, quiz).invalid).toHaveLength(3);
  });

  it("never limits the question count of a reading or listening test", () => {
    const parsed = parseQuizLimits({ time: "", attempts: "", perAttempt: "5" }, { questionCount: 40, hasGroups: true });
    expect(parsed).toEqual({ limits: { timeLimitMinutes: null, maxAttempts: null, questionsPerAttempt: null }, invalid: [] });
  });

  it("starts the form from the test's current settings", () => {
    expect(quizLimitsDraft({ timeLimitMinutes: 45, maxAttempts: null, questionsPerAttempt: 12 })).toEqual({
      time: "45",
      attempts: "",
      perAttempt: "12",
    });
    expect(quizLimitsDraft(null)).toEqual({ time: "", attempts: "", perAttempt: "" });
  });
});

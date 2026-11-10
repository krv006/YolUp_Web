import { describe, expect, it } from "vitest";
import {
  changeType,
  emptyQuestion,
  questionIssue,
  removeOption,
  toggleCorrect,
  toQuestionInputs,
  totalPoints,
} from "./homework-questions";

describe("homework question drafts", () => {
  it("keeps a single correct option and many for multiple choice", () => {
    let question = { ...emptyQuestion("single"), options: ["A", "B", "C"] };
    question = toggleCorrect(question, 1);
    question = toggleCorrect(question, 2);
    expect(question.correct).toEqual([2]);
    question = changeType(question, "multiple");
    question = toggleCorrect(question, 0);
    expect(question.correct).toEqual([0, 2]);
  });

  it("shifts correct answers when an option is removed", () => {
    const question = { ...emptyQuestion("multiple"), options: ["A", "B", "C"], correct: [0, 2] };
    expect(removeOption(question, 1)).toMatchObject({ options: ["A", "C"], correct: [0, 1] });
    expect(removeOption(question, 0).correct).toEqual([1]);
  });

  it("drops options for open questions", () => {
    const question = changeType({ ...emptyQuestion("single"), options: ["A", "B"], correct: [0] }, "long");
    expect(question).toMatchObject({ options: [], correct: [] });
  });

  it("reports what is missing", () => {
    expect(questionIssue(emptyQuestion("short"))).toBe("text");
    expect(questionIssue({ ...emptyQuestion("single"), text: "2+2?", options: ["4", ""] })).toBe("options");
    expect(questionIssue({ ...emptyQuestion("single"), text: "2+2?", options: ["4", "5"] })).toBe("correct");
    expect(questionIssue({ ...emptyQuestion("single"), text: "2+2?", options: ["4", "5"], correct: [0], points: 0 })).toBe("points");
    expect(questionIssue({ ...emptyQuestion("short"), text: "Ismingiz?" })).toBeNull();
  });

  it("builds the request payload", () => {
    const drafts = [
      { ...emptyQuestion("single"), text: " 2+2? ", options: [" 4 ", "5"], correct: [0], points: 2 },
      { ...emptyQuestion("long"), text: "Essay", points: 8 },
    ];
    expect(toQuestionInputs(drafts)).toEqual([
      { type: "single", text: "2+2?", options: ["4", "5"], correct: [0], points: 2 },
      { type: "long", text: "Essay", options: [], correct: [], points: 8 },
    ]);
    expect(totalPoints(drafts)).toBe(10);
  });
});

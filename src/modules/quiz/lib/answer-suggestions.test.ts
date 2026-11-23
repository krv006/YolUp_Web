import { describe, expect, it } from "vitest";
import { applySuggestions, needsAnswer, unansweredCount } from "./answer-suggestions";
import { createDraft, type QuestionDraft } from "./question-draft";

let n = 0;
const key = () => `s${(n += 1)}`;

function mcq(type: "single" | "multiple" = "single", correct: number[] = []): QuestionDraft {
  const draft = createDraft(type, key);
  draft.text = "Savol";
  draft.options.forEach((option, index) => (option.text = `V${index}`));
  draft.correctKeys = correct.map((index) => draft.options[index].key);
  return draft;
}

describe("needsAnswer", () => {
  it("is true only for choice questions without a correct option", () => {
    expect(needsAnswer(mcq("single"))).toBe(true);
    expect(needsAnswer(mcq("multiple"))).toBe(true);
    expect(needsAnswer(mcq("single", [1]))).toBe(false);
    expect(needsAnswer(createDraft("true_false", key))).toBe(false);
    expect(needsAnswer(createDraft("essay", key))).toBe(false);
  });

  it("counts the unanswered ones", () => {
    expect(unansweredCount([mcq(), mcq("single", [0]), mcq("multiple")])).toBe(2);
  });
});

describe("applySuggestions", () => {
  const suggestion = (number: number, correct: number[], confidence: "high" | "medium" | "low" = "high") => ({
    number,
    questionId: `q${number}`,
    correct,
    confidence,
  });

  it("marks the suggested options and reports the confidence per question", () => {
    const drafts = [mcq("single"), mcq("multiple")];
    const { drafts: next, applied } = applySuggestions(drafts, [suggestion(1, [2], "high"), suggestion(2, [0, 3], "medium")]);
    expect(next[0].correctKeys).toEqual([drafts[0].options[2].key]);
    expect(next[1].correctKeys).toEqual([drafts[1].options[0].key, drafts[1].options[3].key]);
    expect(applied).toEqual({ [drafts[0].key]: "high", [drafts[1].key]: "medium" });
  });

  it("never replaces an answer the teacher already marked", () => {
    const drafts = [mcq("single", [1])];
    const { drafts: next, applied } = applySuggestions(drafts, [suggestion(1, [3])]);
    expect(next[0].correctKeys).toEqual([drafts[0].options[1].key]);
    expect(applied).toEqual({});
  });

  it("ignores out-of-range positions, missing questions and keeps a single answer single", () => {
    const drafts = [mcq("single")];
    expect(applySuggestions(drafts, [suggestion(1, [9])]).applied).toEqual({});
    expect(applySuggestions(drafts, [suggestion(5, [0])]).applied).toEqual({});
    const result = applySuggestions(drafts, [suggestion(1, [1, 2])]);
    expect(result.drafts[0].correctKeys).toHaveLength(1);
  });

  it("does not mutate the input list", () => {
    const drafts = [mcq("single")];
    applySuggestions(drafts, [suggestion(1, [0])]);
    expect(drafts[0].correctKeys).toEqual([]);
  });
});

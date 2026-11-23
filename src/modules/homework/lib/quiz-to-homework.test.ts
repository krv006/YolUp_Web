import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/shared/types";
import { quizQuestionsToDrafts } from "./quiz-to-homework";

const labels = { trueLabel: "To‘g‘ri", falseLabel: "Noto‘g‘ri" };

function question(patch: Partial<QuizQuestion> & Pick<QuizQuestion, "type">): QuizQuestion {
  return {
    id: "q",
    groupId: null,
    text: "Savol",
    points: 1,
    order: 0,
    options: [],
    matchLeft: [],
    matchRight: [],
    blankCount: 0,
    ...patch,
  };
}

describe("quizQuestionsToDrafts", () => {
  it("copies single and multiple choice questions with their correct options", () => {
    const { drafts } = quizQuestionsToDrafts(
      [
        question({ type: "single", text: "A?", options: [{ id: "1", text: "x", isCorrect: false }, { id: "2", text: "y", isCorrect: true }] }),
        question({ type: "multiple", points: 3, options: [{ id: "1", text: "a", isCorrect: true }, { id: "2", text: "b", isCorrect: true }, { id: "3", text: "c" }] }),
      ],
      labels
    );
    expect(drafts.map((draft) => draft.type)).toEqual(["single", "multiple"]);
    expect(drafts[0]).toMatchObject({ text: "A?", options: ["x", "y"], correct: [1], points: 1 });
    expect(drafts[1]).toMatchObject({ options: ["a", "b", "c"], correct: [0, 1], points: 3 });
  });

  it("turns true/false into a two-option single choice", () => {
    const { drafts } = quizQuestionsToDrafts(
      [question({ type: "true_false", answerKey: { correctBool: false } }), question({ type: "true_false", answerKey: { correctBool: true } })],
      labels
    );
    expect(drafts[0]).toMatchObject({ type: "single", options: ["To‘g‘ri", "Noto‘g‘ri"], correct: [1] });
    expect(drafts[1]?.correct).toEqual([0]);
  });

  it("maps numeric/text to short and essay to long answers", () => {
    const { drafts } = quizQuestionsToDrafts([question({ type: "numeric" }), question({ type: "text" }), question({ type: "essay", points: 5 })], labels);
    expect(drafts.map((draft) => draft.type)).toEqual(["short", "short", "long"]);
    expect(drafts.every((draft) => draft.options.length === 0 && draft.correct.length === 0)).toBe(true);
    expect(drafts[2]?.points).toBe(5);
  });

  it("skips types homework does not have and reports them by type", () => {
    const result = quizQuestionsToDrafts(
      [question({ type: "matching" }), question({ type: "ordering" }), question({ type: "fill_blank" }), question({ type: "fill_blank" }), question({ type: "single", options: [{ id: "1", text: "x", isCorrect: true }, { id: "2", text: "y" }] })],
      labels
    );
    expect(result.drafts).toHaveLength(1);
    expect(result.skipped).toEqual({ matching: 1, ordering: 1, fill_blank: 2 });
  });

  it("only takes the picked questions but still counts every skipped one", () => {
    const list = [
      question({ type: "single", text: "bir", options: [{ id: "1", text: "x", isCorrect: true }, { id: "2", text: "y" }] }),
      question({ type: "text", text: "ikki" }),
      question({ type: "matching" }),
    ];
    const result = quizQuestionsToDrafts(list, labels, new Set([1]));
    expect(result.drafts.map((draft) => draft.text)).toEqual(["ikki"]);
    expect(result.skipped).toEqual({ matching: 1 });
  });

  it("joins text after the image, clamps points and counts images", () => {
    const { drafts, withImage } = quizQuestionsToDrafts(
      [question({ type: "text", text: "Rasmga qarang.", textAfter: "Bu nima?", points: 0, image: { id: "1", url: "https://x/y.png" } })],
      labels
    );
    expect(drafts[0]?.text).toBe("Rasmga qarang.\nBu nima?");
    expect(drafts[0]?.points).toBe(1);
    expect(withImage).toBe(1);
  });

  it("keeps a single-choice draft invalid-but-editable when the quiz has no marked answer", () => {
    const { drafts } = quizQuestionsToDrafts([question({ type: "single", options: [{ id: "1", text: "x" }, { id: "2", text: "y" }] })], labels);
    expect(drafts[0]?.correct).toEqual([]);
  });
});

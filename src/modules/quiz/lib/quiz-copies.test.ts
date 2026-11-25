import { describe, expect, it } from "vitest";
import { copiesBySource } from "./quiz-copies";

describe("copiesBySource", () => {
  it("counts how many groups got a copy of each original test", () => {
    const counts = copiesBySource([{ sourceQuizId: null }, { sourceQuizId: "q1" }, { sourceQuizId: "q1" }, { sourceQuizId: "q2" }]);
    expect(counts.get("q1")).toBe(2);
    expect(counts.get("q2")).toBe(1);
    expect(counts.has("q3")).toBe(false);
  });
});

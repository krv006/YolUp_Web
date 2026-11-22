import { describe, expect, it } from "vitest";
import { formulaSnippet, insertAt } from "./insert-formula";

describe("formula insertion", () => {
  it("wraps the formula in the dollar marks the quiz text already uses", () => {
    expect(formulaSnippet("\\frac{1}{2}")).toBe("$\\frac{1}{2}$");
    expect(formulaSnippet("x^{\\placeholder{}}")).toBe("$x^{}$");
    expect(formulaSnippet("  ")).toBe("");
  });

  it("puts the formula at the caret with spaces around it", () => {
    expect(insertAt("Javob:", "$x=2$", 6, 6)).toEqual({ value: "Javob: $x=2$", caret: 12 });
    expect(insertAt("a  b", "$y$", 2, 2)).toEqual({ value: "a $y$ b", caret: 5 });
    expect(insertAt("", "$y$", 0, 0)).toEqual({ value: "$y$", caret: 3 });
    expect(insertAt("eski", "$y$", 0, 4)).toEqual({ value: "$y$", caret: 3 });
  });
});

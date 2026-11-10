import { describe, expect, it } from "vitest";
import { indentCode, newlineWithIndent, outdentCode } from "./code-editing";

describe("indentCode", () => {
  it("inserts four spaces at the caret", () => {
    expect(indentCode("ab", 1, 1)).toEqual({ value: "a    b", start: 5, end: 5 });
  });

  it("indents every selected line and keeps the selection on them", () => {
    const value = "a\nb\nc";
    expect(indentCode(value, 0, 3)).toEqual({ value: "    a\n    b\nc", start: 4, end: 11 });
  });
});

describe("outdentCode", () => {
  it("removes up to four leading spaces from the current line", () => {
    expect(outdentCode("      x", 7, 7)).toEqual({ value: "  x", start: 3, end: 3 });
    expect(outdentCode("x", 1, 1)).toEqual({ value: "x", start: 1, end: 1 });
  });

  it("outdents all selected lines", () => {
    expect(outdentCode("    a\n    b", 0, 11).value).toBe("a\nb");
  });
});

describe("newlineWithIndent", () => {
  it("keeps the indentation of the current line", () => {
    expect(newlineWithIndent("def f():\n    return 1", 21, 21)).toEqual({
      value: "def f():\n    return 1\n    ",
      start: 26,
      end: 26,
    });
    expect(newlineWithIndent("x", 1, 1)).toEqual({ value: "x\n", start: 2, end: 2 });
  });

  it("adds one level after a line that opens a block", () => {
    expect(newlineWithIndent("def f(x):", 9, 9).value).toBe("def f(x):\n    ");
    expect(newlineWithIndent("  if (a) {", 10, 10).value).toBe("  if (a) {\n      ");
  });
});

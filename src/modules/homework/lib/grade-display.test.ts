import { describe, expect, it } from "vitest";
import { formatGradeValue, gradePercent } from "./grade-display";

describe("grade display", () => {
  it("shows whole grades without a decimal and keeps one digit otherwise", () => {
    expect(formatGradeValue(5)).toBe("5");
    expect(formatGradeValue(85)).toBe("85");
    expect(formatGradeValue(4.5)).toBe("4.5");
    expect(formatGradeValue(72.25)).toBe("72.3");
  });

  it("turns a score into a bar width", () => {
    expect(gradePercent(85, 100)).toBe(85);
    expect(gradePercent(12, 20)).toBe(60);
    expect(gradePercent(30, 20)).toBe(100);
    expect(gradePercent(5, 0)).toBe(0);
  });
});

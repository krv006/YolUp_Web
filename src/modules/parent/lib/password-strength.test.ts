import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password-strength";

describe("passwordStrength", () => {
  it("rates passwords by length, digits and letter case", () => {
    expect(passwordStrength("abc")).toMatchObject({ length: false, digit: false, cases: false, level: "weak" });
    expect(passwordStrength("yolupyolup")).toMatchObject({ length: true, digit: false, level: "weak" });
    expect(passwordStrength("yolup2026")).toMatchObject({ length: true, digit: true, cases: false, level: "medium" });
    expect(passwordStrength("Yolup2026")).toMatchObject({ cases: true, level: "medium", score: 3 });
    expect(passwordStrength("Yolup2026Parent")).toMatchObject({ level: "strong", score: 4 });
  });
});

import { describe, expect, it } from "vitest";
import { wrapToWidth } from "./wrap-text";

const measure = (value: string) => value.length * 10;

describe("wrapToWidth", () => {
  it("leaves text that fits untouched", () => {
    expect(wrapToWidth("salom dunyo", 200, measure)).toBe("salom dunyo");
    expect(wrapToWidth("a\nb", 200, measure)).toBe("a\nb");
  });

  it("moves words that cross the board edge to a new line", () => {
    expect(wrapToWidth("salom salom salom", 120, measure)).toBe("salom salom\nsalom");
  });

  it("splits a single word longer than the board", () => {
    expect(wrapToWidth("ABCDEFGHIJKLMNO", 50, measure)).toBe("ABCDE\nFGHIJ\nKLMNO");
  });

  it("keeps the line breaks the teacher typed", () => {
    expect(wrapToWidth("bir ikki uch\nto'rt", 80, measure)).toBe("bir ikki\nuch\nto'rt");
  });
});

import { describe, expect, it } from "vitest";
import { normalizeUzPhone } from "./uz-phone";

describe("normalizeUzPhone", () => {
  it("brings every way of typing an Uzbek number to one form", () => {
    expect(normalizeUzPhone("901234567")).toBe("+998901234567");
    expect(normalizeUzPhone("90 123 45 67")).toBe("+998901234567");
    expect(normalizeUzPhone("+998 90 123-45-67")).toBe("+998901234567");
    expect(normalizeUzPhone("998901234567")).toBe("+998901234567");
  });

  it("leaves empty and foreign numbers as typed", () => {
    expect(normalizeUzPhone("")).toBe("");
    expect(normalizeUzPhone(" +7 912 345 67 89 ")).toBe("+7 912 345 67 89");
  });
});

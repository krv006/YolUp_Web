import { describe, expect, it } from "vitest";
import { seriesWeeks, withLocalOffset } from "./lesson-schedule";

describe("seriesWeeks", () => {
  it("counts calendar weeks from the Monday of the first lesson, as the backend expands a series", () => {
    expect(seriesWeeks("2026-11-25", "2026-11-29")).toBe(1);
    expect(seriesWeeks("2026-11-25", "2026-11-30")).toBe(2);
    expect(seriesWeeks("2026-11-23", "2027-01-17")).toBe(8);
    expect(seriesWeeks("2026-11-25", "2028-01-01")).toBe(52);
    expect(seriesWeeks("2026-11-25", "2026-11-20")).toBe(1);
  });
});

describe("withLocalOffset", () => {
  it("adds the browser time zone so the backend gets an exact moment", () => {
    expect(withLocalOffset("2026-11-25", "18:00")).toMatch(/^2026-11-25T18:00:00[+-]\d\d:\d\d$/);
    expect(new Date(withLocalOffset("2026-11-25", "18:00")).getTime()).toBe(new Date(2026, 10, 25, 18, 0).getTime());
  });
});

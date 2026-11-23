import { describe, expect, it } from "vitest";
import { splitDue } from "./due-date";

describe("splitDue", () => {
  it("returns the local date and time of an ISO instant", () => {
    const iso = new Date(2030, 4, 5, 18, 30).toISOString();
    expect(splitDue(iso)).toEqual({ date: "2030-05-05", time: "18:30" });
  });

  it("is null for missing or invalid values", () => {
    expect(splitDue(null)).toBeNull();
    expect(splitDue("")).toBeNull();
    expect(splitDue("bu sana emas")).toBeNull();
  });
});

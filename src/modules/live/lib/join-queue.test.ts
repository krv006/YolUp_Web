import { describe, expect, it } from "vitest";
import { joinDelayTooLong, queueSecondsLeft } from "./join-queue";

describe("join queue", () => {
  it("treats a wait over five minutes as a server fault", () => {
    expect(joinDelayTooLong(4_000)).toBe(false);
    expect(joinDelayTooLong(5 * 60_000)).toBe(false);
    expect(joinDelayTooLong(5 * 60_000 + 1)).toBe(true);
  });

  it("counts whole seconds down to zero", () => {
    expect(queueSecondsLeft(10_000, 4_100)).toBe(6);
    expect(queueSecondsLeft(10_000, 10_000)).toBe(0);
    expect(queueSecondsLeft(10_000, 12_000)).toBe(0);
  });
});

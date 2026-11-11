import { describe, expect, it } from "vitest";
import { formatCountdown, secondsUntil } from "./countdown";

describe("quiz countdown", () => {
  it("shows minutes and seconds, and hours only for long tests", () => {
    expect(formatCountdown(754)).toBe("12:34");
    expect(formatCountdown(59)).toBe("0:59");
    expect(formatCountdown(3725)).toBe("1:02:05");
    expect(formatCountdown(-3)).toBe("0:00");
  });

  it("counts down to the server's end time and stops at zero", () => {
    const now = Date.parse("2026-11-11T10:00:00Z");
    expect(secondsUntil("2026-11-11T10:20:00Z", now)).toBe(1200);
    expect(secondsUntil("2026-11-11T10:00:00.400Z", now)).toBe(1);
    expect(secondsUntil("2026-11-11T09:59:00Z", now)).toBe(0);
    expect(secondsUntil(null, now)).toBeNull();
  });
});

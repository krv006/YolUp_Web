import { describe, expect, it } from "vitest";
import { emailSetupOverdue, formatDeadline, localDay } from "./email-setup";

describe("email setup deadline", () => {
  it("is a reminder until the deadline day ends and required after it", () => {
    expect(emailSetupOverdue(null, "2026-12-10")).toBe(false);
    expect(emailSetupOverdue("2026-12-02", "2026-12-01")).toBe(false);
    expect(emailSetupOverdue("2026-12-02", "2026-12-02")).toBe(false);
    expect(emailSetupOverdue("2026-12-02", "2026-12-03")).toBe(true);
  });

  it("formats the deadline and today's local day", () => {
    expect(formatDeadline("2026-12-02")).toBe("02.12.2026");
    expect(localDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

import { describe, expect, it } from "vitest";
import { mapClientHealth, shortUserAgent } from "./client-health";

describe("client health", () => {
  it("maps the summary and puts the slowest devices first", () => {
    const summary = mapClientHealth(
      {
        hours: 24,
        total: 118,
        cpu_limited_total: 9,
        users: [
          { user_id: 1, username: "ali", role: "student", reports: 14, cpu_limited_reports: 0, min_fps: 24 },
          { user_id: 2, username: "aziza", role: "teacher", reports: 20, cpu_limited_reports: 3, min_fps: 6, hardware_concurrency: 4, device_memory_gb: 4 },
          { user_id: 3, username: "bobur", role: "student", reports: 9, cpu_limited_reports: 0, min_fps: 11 },
        ],
      },
      24
    );
    expect(summary).toMatchObject({ hours: 24, total: 118, cpuLimitedTotal: 9 });
    expect(summary.users.map((user) => user.username)).toEqual(["aziza", "bobur", "ali"]);
    expect(summary.users[0]).toMatchObject({ cores: 4, memoryGb: 4, cpuLimitedReports: 3 });
  });

  it("survives an empty answer", () => {
    expect(mapClientHealth(null, 72)).toEqual({ hours: 72, total: 0, cpuLimitedTotal: 0, users: [] });
  });

  it("shortens the user agent to browser and system", () => {
    expect(
      shortUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    ).toBe("Chrome 131 · Windows");
    expect(
      shortUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15")
    ).toBe("Safari 18 · macOS");
    expect(shortUserAgent("")).toBe("");
  });
});

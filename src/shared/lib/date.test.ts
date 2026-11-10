import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n";
import { formatDayLabel, formatNotificationTime, isSameLocalDay } from "./date";

const NOW = new Date(2026, 10, 10, 15, 30);

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  await i18n.changeLanguage("uz");
});

afterAll(() => {
  vi.useRealTimers();
});

describe("formatDayLabel", () => {
  it("names today and yesterday", () => {
    expect(formatDayLabel(new Date(2026, 10, 10, 9, 0))).toBe("Bugun");
    expect(formatDayLabel(new Date(2026, 10, 9, 23, 59))).toBe("Kecha");
  });

  it("writes older days with the month name", () => {
    expect(formatDayLabel(new Date(2026, 10, 3, 12, 0))).toBe("3-noyabr");
    expect(formatDayLabel(new Date(2025, 11, 31, 12, 0))).toBe("31-dekabr 2025");
  });
});

describe("formatNotificationTime", () => {
  it("shows only the time for today", () => {
    expect(formatNotificationTime(new Date(2026, 10, 10, 11, 45))).toBe("11:45");
  });

  it("adds the day for older notifications", () => {
    expect(formatNotificationTime(new Date(2026, 10, 9, 19, 15))).toBe("Kecha, 19:15");
    expect(formatNotificationTime(new Date(2026, 10, 8, 22, 45))).toBe("8-noy, 22:45");
  });
});

describe("isSameLocalDay", () => {
  it("compares calendar days, not 24 hour windows", () => {
    expect(isSameLocalDay(new Date(2026, 10, 9, 23, 50), new Date(2026, 10, 10, 0, 5))).toBe(false);
    expect(isSameLocalDay(new Date(2026, 10, 10, 0, 5), new Date(2026, 10, 10, 23, 50))).toBe(true);
  });
});

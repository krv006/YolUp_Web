import { describe, expect, it } from "vitest";
import type { Lesson } from "@/shared/types";
import {
  consentGranted,
  courseSchedule,
  newDeviceCount,
  recentUnlink,
  remindedRecently,
  suggestUsername,
  tempPassword,
  usernameAlternatives,
} from "./parent-family";

const NOW = new Date(2026, 9, 29, 14, 39).getTime();
const at = (day: number, hour: number, minute = 0, month = 9) => new Date(2026, month, day, hour, minute).toISOString();
const lesson = (id: string, startsAt: string, status: Lesson["status"], courseId = "c1") =>
  ({ id, startsAt, status, courseId, courseTitle: "Ingliz tili A1", durationMinutes: 90 }) as Lesson;
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length];
};

describe("courseSchedule", () => {
  it("collects weekdays and the usual start time of upcoming lessons", () => {
    const lessons = [
      lesson("a", at(30, 16), "scheduled"),
      lesson("b", at(2, 16, 0, 10), "scheduled"),
      lesson("c", at(4, 16, 0, 10), "scheduled"),
      lesson("d", at(5, 18, 0, 10), "scheduled"),
      lesson("e", at(31, 9), "scheduled", "c2"),
      lesson("f", at(28, 16), "finished"),
    ];
    expect(courseSchedule(lessons, "c1", NOW)).toEqual({ days: [0, 2, 3, 4], time: "16:00" });
    expect(courseSchedule(lessons, "c9", NOW)).toBeNull();
  });
});

describe("newDeviceCount", () => {
  it("counts new devices in the last 30 days", () => {
    const logins = [
      { at: at(28, 9), device: "Chrome", isNewDevice: true },
      { at: at(27, 9), device: "Safari", isNewDevice: false },
      { at: at(1, 9, 0, 8), device: "Old", isNewDevice: true },
    ];
    expect(newDeviceCount(logins, NOW)).toBe(1);
  });
});

describe("child account helpers", () => {
  it("builds a login from the name", () => {
    expect(suggestUsername("Toshmat", "Boltayev")).toBe("toshmat_b");
    expect(suggestUsername("G‘ulomjon", "")).toBe("gulomjon");
    expect(suggestUsername("", "Boltayev")).toBe("boltayev");
  });

  it("offers alternatives when the login is taken", () => {
    expect(usernameAlternatives("Toshmat", "Boltayev", "toshmat_b", sequence(0.2, 0.0, 0.1))).toEqual([
      "toshmat_b2",
      "toshmat.boltayev",
      "tb_201",
    ]);
    expect(usernameAlternatives("Toshmat", "Boltayev", "toshmat_b2", sequence(0.5))).not.toContain("toshmat_b2");
  });

  it("makes a temporary password of at least 8 characters", () => {
    expect(tempPassword("Toshmat", sequence(0.4, 0.8, 0.2, 0.1))).toBe("Tosh-4821");
    expect(tempPassword("Al", sequence(0.1))).toBe("Al-11111");
    expect(tempPassword("", sequence(0.3))).toBe("Yolup-3333");
    for (const name of ["A", "Ali", "Toshmat", "Ёқубжон", ""]) expect(tempPassword(name).length).toBeGreaterThanOrEqual(8);
  });
});

describe("recentUnlink", () => {
  const link = (id: string, status: string, studentId: string, respondedAt: string | null) => ({ id, status, studentId, respondedAt });

  it("returns the newest recent decline that was not seen yet", () => {
    const links = [
      link("old", "declined", "s3", at(10, 9)),
      link("new", "declined", "s2", at(28, 9)),
      link("ok", "approved", "s1", at(1, 9)),
      link("again", "declined", "s1", at(29, 9)),
    ];
    expect(recentUnlink(links, new Set(["s1"]), new Set(), NOW)?.id).toBe("new");
    expect(recentUnlink(links, new Set(["s1"]), new Set(["new"]), NOW)).toBeNull();
    expect(recentUnlink([link("pending", "declined", "s4", null)], new Set(), new Set(), NOW)).toBeNull();
  });
});

describe("consentGranted", () => {
  const consents = [
    { studentId: "s1", kind: "analytics", granted: false },
    { studentId: "s1", kind: "camera", granted: true },
    { studentId: "s2", kind: "recording", granted: false },
  ];

  it("treats a missing record as granted, like the server", () => {
    expect(consentGranted(consents, "s1", "recording")).toBe(true);
    expect(consentGranted([], "s1", "analytics")).toBe(true);
  });

  it("is off only for an explicit false record of that child", () => {
    expect(consentGranted(consents, "s1", "analytics")).toBe(false);
    expect(consentGranted(consents, "s1", "camera")).toBe(true);
    expect(consentGranted(consents, "s2", "recording")).toBe(false);
    expect(consentGranted(consents, "s2", "analytics")).toBe(true);
  });
});

describe("remindedRecently", () => {
  it("blocks a second reminder within 24 hours", () => {
    expect(remindedRecently(new Date(NOW - 3_600_000).toISOString(), NOW)).toBe(true);
    expect(remindedRecently(new Date(NOW - 86_400_000 - 1).toISOString(), NOW)).toBe(false);
  });

  it("allows reminding when there is no valid timestamp", () => {
    expect(remindedRecently(null, NOW)).toBe(false);
    expect(remindedRecently("not-a-date", NOW)).toBe(false);
  });
});

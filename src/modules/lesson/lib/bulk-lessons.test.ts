import { describe, expect, it } from "vitest";
import {
  bulkLessonErrors,
  bulkLessonsRequest,
  bulkRowErrors,
  bulkRowsReady,
  createBulkRow,
  findBulkOverlaps,
  isBulkRowInPast,
  nextBulkRow,
} from "./bulk-lessons";

const row = (date: string, time: string, duration = 60, topic = "Mavzu") => createBulkRow({ topic, date, time, duration });

describe("bulk lessons", () => {
  it("builds one request with every lesson of the group", () => {
    const body = bulkLessonsRequest("c1", [row("2026-11-12", "18:00", 90, "  Kasrlar "), row("2026-11-14", "10:00")]);
    expect(body).toEqual({
      course: "c1",
      lessons: [
        { title: "Kasrlar", starts_at: "2026-11-12T18:00:00", duration_min: 90 },
        { title: "Mavzu", starts_at: "2026-11-14T10:00:00", duration_min: 60 },
      ],
    });
  });

  it("suggests the next day at the same time for a new row", () => {
    const next = nextBulkRow(row("2026-11-30", "18:30", 45, "Birinchi"));
    expect(next).toMatchObject({ topic: "", date: "2026-12-01", time: "18:30", duration: 45 });
  });

  it("marks only the rows that overlap each other", () => {
    const first = row("2026-11-12", "18:00", 90);
    const second = row("2026-11-12", "19:00");
    const third = row("2026-11-12", "19:30");
    const later = row("2026-11-13", "18:00");
    const clashing = findBulkOverlaps([first, second, third, later]);
    expect([...clashing].sort()).toEqual([first.id, second.id, third.id].sort());
  });

  it("treats a start at or before now as past", () => {
    const now = new Date(2026, 10, 11, 12, 0);
    expect(isBulkRowInPast({ date: "2026-11-11", time: "12:00" }, now)).toBe(true);
    expect(isBulkRowInPast({ date: "2026-11-11", time: "12:01" }, now)).toBe(false);
    expect(isBulkRowInPast({ date: "", time: "12:01" }, now)).toBe(true);
  });

  it("is ready only when every row has a topic and a future start", () => {
    const now = new Date(2026, 10, 11, 12, 0);
    expect(bulkRowsReady([row("2026-11-12", "18:00"), row("2026-11-13", "18:00")], now)).toBe(true);
    expect(bulkRowsReady([row("2026-11-12", "18:00"), row("2026-11-13", "18:00", 60, "  ")], now)).toBe(false);
    expect(bulkRowsReady([row("2026-11-10", "18:00")], now)).toBe(false);
    expect(bulkRowsReady([], now)).toBe(false);
  });

  it("reads which lesson the server rejected", () => {
    const details = { lessons: { "1": { starts_at: ["Dars boshlanish vaqti o'tgan"] }, "3": { title: ["Bo'sh"] } } };
    expect(bulkLessonErrors(details)).toEqual({ 1: "Dars boshlanish vaqti o'tgan", 3: "Bo'sh" });
    expect(bulkLessonErrors({ lessons: ["Kamida bitta dars yuboring."] })).toEqual({});
    expect(bulkLessonErrors(null)).toEqual({});
  });

  it("puts each server error on its own row", () => {
    const rows = [row("2026-11-12", "18:00"), row("2026-11-13", "18:00")];
    const error = Object.assign(new Error("Dars boshlanish vaqti o'tgan"), {
      details: { lessons: { "1": { starts_at: ["Dars boshlanish vaqti o'tgan"] }, "7": { title: ["?"] } } },
    });
    expect(bulkRowErrors(error, rows)).toEqual({ [rows[1].id]: "Dars boshlanish vaqti o'tgan" });
    expect(bulkRowErrors(new Error("Tarmoq"), rows)).toEqual({});
  });
});

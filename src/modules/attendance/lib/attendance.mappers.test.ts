import { describe, expect, it } from "vitest";
import type { AttendanceDto } from "../api/attendance.dto";
import { mapAttendanceDto, mapAttendanceSummary } from "./attendance.mappers";

const base = {
  id: 1,
  lesson: "l1",
  lesson_title: "Speaking",
  student: { id: "s1", username: "bekzod", first_name: "Bekzod", last_name: "Aliyev", avatar: "https://cdn.example/s1.png" },
  joined_at: "2026-10-29T14:15:37+05:00",
  left_at: "2026-10-29T15:00:00+05:00",
  minutes: 44,
  attention_total: 3,
  attention_answered: 2,
  focus_exits: 1,
  focus_percent: 92,
  focus_alert: false,
  focus: { exits: 1, away_seconds: 210, longest_seconds: 210, timeline: [{ left_at: "2026-10-29T14:30:00+05:00", returned_at: null, seconds: null }] },
} as unknown as AttendanceDto;

describe("mapAttendanceDto", () => {
  it("maps the student into a real user", () => {
    const row = mapAttendanceDto(base);
    expect(row.student).toMatchObject({ id: "s1", name: "Bekzod Aliyev", avatarUrl: "https://cdn.example/s1.png" });
    expect(row.child).toBe("Bekzod Aliyev");
  });

  it("keeps null while the lesson is still running", () => {
    const row = mapAttendanceDto({ ...base, left_at: null, minutes: null, focus_percent: null });
    expect(row.minutes).toBeNull();
    expect(row.focusPercent).toBeNull();
    expect(row.status).toBe("active");
    expect(row.duration).toBe("Darsda");
  });

  it("keeps an unknown exit duration as null", () => {
    expect(mapAttendanceDto(base).focus.timeline[0].seconds).toBeNull();
  });
});

describe("mapAttendanceSummary", () => {
  it("does not turn a missing focus into 0%", () => {
    const summary = mapAttendanceSummary({
      attendance_percent: 0,
      focus_percent: null,
      lesson_count: 0,
      students: [{ id: 5, name: "Nilufar", attendance_percent: 0, focus_percent: null, attended_count: 0 }],
    });
    expect(summary.focusPercent).toBeNull();
    expect(summary.students[0]).toEqual({ id: "5", name: "Nilufar", attendancePercent: 0, focusPercent: null, attendedCount: 0 });
  });

  it("survives an empty response", () => {
    expect(mapAttendanceSummary(null)).toEqual({ attendancePercent: 0, focusPercent: null, lessonCount: 0, students: [] });
  });
});

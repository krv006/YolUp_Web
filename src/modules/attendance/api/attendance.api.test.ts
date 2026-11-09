import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { attendanceApi } from "./attendance.api";

const row = {
  id: "a1",
  lesson: "l1",
  student: "s1",
  joined_at: "2026-11-06T09:05:00Z",
  left_at: "2026-11-06T10:00:00Z",
  teacher_note: "Faol qatnashdi",
  late_reason: "Transport",
};

afterEach(() => vi.restoreAllMocks());

describe("attendanceApi.updateNote", () => {
  it("patches only the fields the teacher changed", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue(row);
    const saved = await attendanceApi.updateNote("a1", { teacherNote: "Faol qatnashdi", lateReason: "Transport" });
    expect(patch).toHaveBeenCalledWith("/api/v1/attendance/a1/", { teacher_note: "Faol qatnashdi", late_reason: "Transport" });
    expect(saved).toMatchObject({ id: "a1", teacherNote: "Faol qatnashdi", lateReason: "Transport" });

    await attendanceApi.updateNote("a1", { lateReason: "" });
    expect(patch).toHaveBeenLastCalledWith("/api/v1/attendance/a1/", { late_reason: "" });
  });
});

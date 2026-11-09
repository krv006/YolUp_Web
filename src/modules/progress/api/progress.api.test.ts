import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { progressApi } from "./progress.api";

const course = {
  course_id: "c1",
  course_title: "Algebra",
  monthly_fee: 450000,
  range: "30d",
  month: "2026-11",
  lesson_count: 6,
  summary: { students: 0, paid: 0, unpaid: 0, attendance_percent: null, focus_percent: null, homework_completion_percent: null },
  students: [],
};

const detail = {
  id: "s1",
  name: "Aziza",
  username: "aziza",
  joined_at: "2026-08-01T09:00:00Z",
  last_visit_at: null,
  attendance: { percent: null, attended: 0, total: 0, focus_percent: null },
  homework: { total: 0, submitted: 0, checked: 0, awaiting_review: 0, resubmit_requested: 0, missed: 0, completion_percent: null, average: null, scale: 10 },
  payment: { period: "2026-11", status: "unpaid", amount: null, paid_at: null, note: "" },
  lessons: [],
  assignments: [],
  payments: [],
};

afterEach(() => vi.restoreAllMocks());

describe("progressApi", () => {
  it("sends the attendance range with the payment month", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(course);
    await progressApi.getCourse("c1", "2026-10", "30d");
    expect(get).toHaveBeenCalledWith("/api/v1/courses/c1/progress/", { query: { range: "30d", month: "2026-10" } });
  });

  it("omits the month until one is chosen and passes the range to the student detail", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce(course).mockResolvedValueOnce(detail);
    await progressApi.getCourse("c1", undefined, "all");
    expect(get).toHaveBeenLastCalledWith("/api/v1/courses/c1/progress/", { query: { range: "all" } });
    await progressApi.getStudent("c1", "s1", "month");
    expect(get).toHaveBeenLastCalledWith("/api/v1/courses/c1/students/s1/progress/", { query: { range: "month" } });
  });
});

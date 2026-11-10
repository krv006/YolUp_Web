import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { mapCourseDto } from "../lib/course.mappers";
import { courseApi } from "./course.api";

afterEach(() => vi.restoreAllMocks());

describe("course payments", () => {
  it("maps the payment day, reminders and unpaid counts", () => {
    const course = mapCourseDto({
      id: "c1",
      title: "Algebra",
      monthly_fee: 450000,
      payment_day: 5,
      payment_reminder_days: [7, 3],
      unpaid_count: 4,
      overdue_count: 1,
    });
    expect(course).toMatchObject({ paymentDay: 5, paymentReminderDays: [7, 3], unpaidCount: 4, overdueCount: 1, kind: "group" });
  });

  it("drops reminders when no due day is set", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ id: "c1", title: "Algebra" });
    await courseApi.updatePayments("c1", { monthlyFee: 450000, paymentDay: null, reminderDays: [3] });
    expect(patch).toHaveBeenLastCalledWith(expect.any(String), { monthly_fee: 450000, payment_day: null, payment_reminder_days: [] });
    await courseApi.updatePayments("c1", { monthlyFee: null, paymentDay: 10, reminderDays: [3, 7, 3] });
    expect(patch).toHaveBeenLastCalledWith(expect.any(String), { monthly_fee: null, payment_day: 10, payment_reminder_days: [7, 3] });
  });
});

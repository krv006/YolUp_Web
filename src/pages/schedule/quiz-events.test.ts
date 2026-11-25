import { describe, expect, it } from "vitest";
import type { ScheduleQuizItem } from "@/modules/lesson";
import { isQuizEvent, quizEventId, quizEvents, scheduleRange } from "./quiz-events";

const quiz = (patch: Partial<ScheduleQuizItem>): ScheduleQuizItem => ({
  id: "q1",
  courseId: "c1",
  courseTitle: "",
  title: "Kasrlar",
  startsAt: "2026-11-26T09:00:00+05:00",
  endsAt: null,
  ...patch,
});

const options = { courseTitle: () => "Math 2", label: (title: string) => `Test: ${title}`, now: new Date("2026-11-25T12:00:00+05:00") };

describe("quizEvents", () => {
  it("places an assigned test at its opening time from the schedule feed", () => {
    const [opening] = quizEvents([quiz({ endsAt: "2026-11-27T23:59:00+05:00" })], options);
    expect(opening).toMatchObject({ date: "2026-11-26", time: "09:00", title: "Test: Kasrlar", courseTitle: "Math 2", status: "scheduled" });
    expect(isQuizEvent(opening)).toBe(true);
    expect(quizEventId(opening)).toBe("q1");
  });

  it("prefers the group name from the feed and marks overdue tests finished", () => {
    const [event] = quizEvents([quiz({ courseTitle: "Algebra", startsAt: "2026-11-20T09:00:00+05:00", endsAt: "2026-11-24T23:59:00+05:00" })], options);
    expect(event).toMatchObject({ courseTitle: "Algebra", status: "finished" });
  });
});

describe("scheduleRange", () => {
  it("covers the whole month grid around the anchor, Monday to Sunday", () => {
    expect(scheduleRange(new Date(2026, 10, 25))).toEqual({ from: "2026-10-26", to: "2026-12-06" });
    expect(scheduleRange(new Date(2026, 5, 1))).toEqual({ from: "2026-06-01", to: "2026-07-05" });
  });
});

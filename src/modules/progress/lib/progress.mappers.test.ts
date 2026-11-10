import { describe, expect, it } from "vitest";
import type { CourseProgressDto, StudentProgressDetailDto } from "../api/progress.dto";
import {
  daysSinceVisit,
  mapCourseProgress,
  mapPayment,
  mapStudentProgress,
  mapStudentProgressDetail,
  matchesStudent,
  paymentMonthBounds,
  shiftMonth,
  sortStudents,
} from "./progress.mappers";

const student = {
  id: "s1",
  name: "Aziza Rahimova",
  username: "aziza",
  joined_at: "2026-08-01T09:12:00Z",
  last_visit_at: null,
  attendance: { percent: 92, attended: 11, total: 12, focus_percent: null },
  homework: {
    total: 9,
    submitted: 8,
    checked: 6,
    awaiting_review: 2,
    resubmit_requested: 0,
    missed: 1,
    completion_percent: 89,
    average: 8.4,
    scale: 10,
  },
  payment: { period: "2026-11", status: "paid", amount: 450000, paid_at: "2026-11-01T10:00:00Z", note: "Naqd", unpaid_months: 0 },
} satisfies CourseProgressDto["students"][number];

describe("mapCourseProgress", () => {
  it("maps summary, students and payment", () => {
    const result = mapCourseProgress({
      course_id: "c1",
      course_title: "Algebra",
      monthly_fee: 450000,
      range: "all",
      month: "2026-11",
      lesson_count: 12,
      summary: { students: 1, paid: 1, unpaid: 0, attendance_percent: 92, focus_percent: null, homework_completion_percent: 89 },
      students: [student],
    });
    expect(result.summary).toMatchObject({ paid: 1, attendancePercent: 92, focusPercent: null, homeworkCompletionPercent: 89 });
    expect(result.students[0]).toMatchObject({
      id: "s1",
      lastVisitAt: null,
      attendance: { percent: 92, attended: 11, total: 12, focusPercent: null },
      homework: { submitted: 8, awaitingReview: 2, missed: 1, completionPercent: 89, average: 8.4 },
      payment: { status: "paid", amount: 450000, note: "Naqd", unpaidMonths: 0 },
    });
  });

  it("falls back to username and empty values", () => {
    const result = mapCourseProgress({
      course_id: "c1",
      course_title: "Algebra",
      monthly_fee: null,
      range: "all",
      month: "2026-11",
      lesson_count: 0,
      summary: { students: 1, paid: 0, unpaid: 1, attendance_percent: null, focus_percent: null, homework_completion_percent: null },
      students: [
        {
          ...student,
          name: "",
          attendance: { percent: null, attended: 0, total: 0, focus_percent: null },
          payment: { period: "2026-11", status: "unpaid", amount: null, paid_at: null, note: "", unpaid_months: 3 },
        },
      ],
    });
    expect(result.monthlyFee).toBeNull();
    expect(result.students[0]).toMatchObject({ name: "aziza", payment: { status: "unpaid", amount: null, unpaidMonths: 3 } });
    expect(result.students[0].attendance.percent).toBeNull();
  });
});

describe("mapStudentProgressDetail", () => {
  it("maps lessons, assignments and payment history", () => {
    const detail = mapStudentProgressDetail({
      ...student,
      lessons: [
        {
          lesson_id: "l1",
          title: "Tenglamalar",
          starts_at: "2026-11-02T10:00:00Z",
          attended: true,
          joined_at: "2026-11-02T10:01:00Z",
          left_at: "2026-11-02T10:50:00Z",
          minutes: 49,
          late_reason: "",
          teacher_note: "Faol",
        },
      ],
      assignments: [
        { assignment_id: "a1", title: "Essay", due_at: null, state: "missed", submitted_at: null, submission_id: null, score: null },
        { assignment_id: "a2", title: "Test", due_at: null, state: "done", submitted_at: "2026-11-03T09:00:00Z", submission_id: "sub2", score: 8.5 },
      ],
      payments: [
        { period: "2026-11", status: "paid", amount: 450000, paid_at: "2026-11-01T10:00:00Z", note: "", },
        { period: "2026-10", status: "unpaid", amount: null, paid_at: null, note: "" },
      ],
    } satisfies StudentProgressDetailDto);
    expect(detail.lessons[0]).toMatchObject({
      lessonId: "l1",
      attended: true,
      joinedAt: "2026-11-02T10:01:00Z",
      leftAt: "2026-11-02T10:50:00Z",
      minutes: 49,
      teacherNote: "Faol",
    });
    expect(detail.assignments[0]).toMatchObject({ assignmentId: "a1", state: "missed", dueAt: null, score: null, submissionId: null });
    expect(detail.assignments[1]).toMatchObject({ submissionId: "sub2", score: 8.5 });
    expect(detail.payments.map((item) => item.status)).toEqual(["paid", "unpaid"]);
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -3)).toBe("2025-12");
  });
});

describe("paymentMonthBounds", () => {
  const now = new Date(2026, 10, 9, 12);

  it("starts at the earliest join month and allows a year of advance payments", () => {
    expect(paymentMonthBounds(["2026-09-03T10:00:00Z", "2026-08-01T09:00:00Z"], now)).toEqual({
      min: "2026-08",
      max: "2027-11",
      current: "2026-11",
    });
  });

  it("falls back to the current month and never goes before 2020", () => {
    expect(paymentMonthBounds([], now).min).toBe("2026-11");
    expect(paymentMonthBounds(["2019-05-01T00:00:00Z", "bad"], now).min).toBe("2020-01");
  });
});

describe("student search and sorting", () => {
  const make = (id: string, name: string, attendance: number | null, completion: number | null, unpaid: number) =>
    mapStudentProgress({
      ...student,
      id,
      name,
      username: name.split(" ")[0].toLowerCase(),
      attendance: { ...student.attendance, percent: attendance },
      homework: { ...student.homework, completion_percent: completion },
      payment: { ...student.payment, unpaid_months: unpaid },
    });
  const list = [make("a", "O‘tkir Sobirov", 92, 80, 0), make("b", "Bekzod Aliyev", 40, null, 3), make("c", "Aziza Karimova", null, 20, 1)];

  it("finds by name or username, ignoring case and apostrophe style", () => {
    expect(list.filter((item) => matchesStudent(item, "o'tkir")).map((item) => item.id)).toEqual(["a"]);
    expect(list.filter((item) => matchesStudent(item, "ALIYEV")).map((item) => item.id)).toEqual(["b"]);
    expect(list.filter((item) => matchesStudent(item, "  ")).length).toBe(3);
  });

  it("sorts weakest attendance and homework first, with missing values last", () => {
    expect(sortStudents(list, "attendance").map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(sortStudents(list, "homework").map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by debt and by name without mutating the input", () => {
    expect(sortStudents(list, "debt").map((item) => item.id)).toEqual(["b", "c", "a"]);
    expect(sortStudents(list, "name").map((item) => item.id)).toEqual(["c", "b", "a"]);
    expect(list.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

describe("daysSinceVisit", () => {
  const now = new Date("2026-11-09T12:00:00Z");

  it("counts whole days since the last lesson visit", () => {
    expect(daysSinceVisit("2026-11-09T08:00:00Z", now)).toBe(0);
    expect(daysSinceVisit("2026-10-26T12:00:00Z", now)).toBe(14);
  });

  it("returns null when the student never joined a lesson", () => {
    expect(daysSinceVisit(null, now)).toBeNull();
    expect(daysSinceVisit("bad", now)).toBeNull();
  });
});

describe("mapPayment overdue", () => {
  it("marks only unpaid months as overdue", () => {
    expect(mapPayment({ period: "2026-11", status: "unpaid", amount: null, paid_at: null, note: "", overdue: true }).overdue).toBe(true);
    expect(mapPayment({ period: "2026-11", status: "paid", amount: 1, paid_at: "x", note: "", overdue: true }).overdue).toBe(false);
    expect(mapPayment({ period: "2026-11", status: "unpaid", amount: null, paid_at: null, note: "" }).overdue).toBe(false);
  });
});

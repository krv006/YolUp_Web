import type { CourseProgressDto, PaymentDto, StudentProgressDetailDto, StudentProgressDto } from "../api/progress.dto";

export type PaymentStatus = "paid" | "unpaid";
export type AssignmentState = "done" | "awaiting_review" | "resubmit" | "missed" | "not_submitted";

export interface Payment {
  period: string;
  status: PaymentStatus;
  amount: number | null;
  paidAt: string | null;
  note: string;
  unpaidMonths: number;
}

export interface StudentProgress {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  lastVisitAt: string | null;
  attendance: { percent: number | null; attended: number; total: number; focusPercent: number | null };
  homework: {
    total: number;
    submitted: number;
    checked: number;
    awaitingReview: number;
    resubmitRequested: number;
    missed: number;
    completionPercent: number | null;
    average: number | null;
    scale: number;
  };
  payment: Payment;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  monthlyFee: number | null;
  month: string;
  lessonCount: number;
  summary: {
    students: number;
    paid: number;
    unpaid: number;
    attendancePercent: number | null;
    focusPercent: number | null;
    homeworkCompletionPercent: number | null;
  };
  students: StudentProgress[];
}

export interface StudentProgressDetail extends StudentProgress {
  lessons: Array<{
    lessonId: string;
    title: string;
    startsAt: string;
    attended: boolean;
    minutes: number | null;
    lateReason: string;
    teacherNote: string;
  }>;
  assignments: Array<{
    assignmentId: string;
    title: string;
    dueAt: string | null;
    state: AssignmentState;
    submittedAt: string | null;
    score: number | null;
  }>;
  payments: Payment[];
}

export function mapPayment(dto: PaymentDto): Payment {
  return {
    period: dto.period,
    status: dto.status === "paid" ? "paid" : "unpaid",
    amount: dto.amount ?? null,
    paidAt: dto.paid_at ?? null,
    note: dto.note ?? "",
    unpaidMonths: dto.unpaid_months ?? 0,
  };
}

export function mapStudentProgress(dto: StudentProgressDto): StudentProgress {
  return {
    id: String(dto.id),
    name: dto.name || dto.username,
    username: dto.username,
    joinedAt: dto.joined_at,
    lastVisitAt: dto.last_visit_at ?? null,
    attendance: {
      percent: dto.attendance?.percent ?? null,
      attended: dto.attendance?.attended ?? 0,
      total: dto.attendance?.total ?? 0,
      focusPercent: dto.attendance?.focus_percent ?? null,
    },
    homework: {
      total: dto.homework?.total ?? 0,
      submitted: dto.homework?.submitted ?? 0,
      checked: dto.homework?.checked ?? 0,
      awaitingReview: dto.homework?.awaiting_review ?? 0,
      resubmitRequested: dto.homework?.resubmit_requested ?? 0,
      missed: dto.homework?.missed ?? 0,
      completionPercent: dto.homework?.completion_percent ?? null,
      average: dto.homework?.average ?? null,
      scale: dto.homework?.scale ?? 10,
    },
    payment: mapPayment(dto.payment),
  };
}

export function mapCourseProgress(dto: CourseProgressDto): CourseProgress {
  return {
    courseId: String(dto.course_id),
    courseTitle: dto.course_title,
    monthlyFee: dto.monthly_fee ?? null,
    month: dto.month,
    lessonCount: dto.lesson_count ?? 0,
    summary: {
      students: dto.summary?.students ?? 0,
      paid: dto.summary?.paid ?? 0,
      unpaid: dto.summary?.unpaid ?? 0,
      attendancePercent: dto.summary?.attendance_percent ?? null,
      focusPercent: dto.summary?.focus_percent ?? null,
      homeworkCompletionPercent: dto.summary?.homework_completion_percent ?? null,
    },
    students: (dto.students ?? []).map(mapStudentProgress),
  };
}

export function mapStudentProgressDetail(dto: StudentProgressDetailDto): StudentProgressDetail {
  return {
    ...mapStudentProgress(dto),
    lessons: (dto.lessons ?? []).map((item) => ({
      lessonId: String(item.lesson_id),
      title: item.title,
      startsAt: item.starts_at,
      attended: item.attended,
      minutes: item.minutes ?? null,
      lateReason: item.late_reason ?? "",
      teacherNote: item.teacher_note ?? "",
    })),
    assignments: (dto.assignments ?? []).map((item) => ({
      assignmentId: String(item.assignment_id),
      title: item.title,
      dueAt: item.due_at ?? null,
      state: item.state,
      submittedAt: item.submitted_at ?? null,
      score: item.score ?? null,
    })),
    payments: (dto.payments ?? []).map(mapPayment),
  };
}

/** `YYYY-MM` ni `delta` oyga siljitadi (oldinga yoki orqaga). */
export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const index = year * 12 + (mon - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export interface PaymentDto {
  period: string;
  status: "paid" | "unpaid";
  amount: number | null;
  paid_at: string | null;
  note: string;
  unpaid_months?: number;
}

export interface StudentProgressDto {
  id: string;
  name: string;
  username: string;
  joined_at: string;
  last_visit_at: string | null;
  attendance: { percent: number | null; attended: number; total: number; focus_percent: number | null };
  homework: {
    total: number;
    submitted: number;
    checked: number;
    awaiting_review: number;
    resubmit_requested: number;
    missed: number;
    completion_percent: number | null;
    average: number | null;
    scale: number;
  };
  payment: PaymentDto;
}

export interface CourseProgressDto {
  course_id: string;
  course_title: string;
  monthly_fee: number | null;
  range: string;
  month: string;
  lesson_count: number;
  summary: {
    students: number;
    paid: number;
    unpaid: number;
    attendance_percent: number | null;
    focus_percent: number | null;
    homework_completion_percent: number | null;
  };
  students: StudentProgressDto[];
}

export interface StudentProgressDetailDto extends StudentProgressDto {
  lessons: Array<{
    lesson_id: string;
    title: string;
    starts_at: string;
    attended: boolean;
    joined_at: string | null;
    left_at: string | null;
    minutes: number | null;
    late_reason: string;
    teacher_note: string;
  }>;
  assignments: Array<{
    assignment_id: string;
    title: string;
    due_at: string | null;
    state: "done" | "awaiting_review" | "resubmit" | "missed" | "not_submitted";
    submitted_at: string | null;
    submission_id: string | null;
    score: number | null;
  }>;
  payments: PaymentDto[];
}

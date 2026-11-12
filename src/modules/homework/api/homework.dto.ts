import type { AssignmentStatus, GradingScale, HomeworkQuestionType, SubmissionStatus } from "@/shared/types";

import type { StrokeDto } from "@/modules/board";

/** Uy vazifasi doskasi: server javobi. */
export interface HomeworkBoardDto {
  sheets: Array<{ index: number; strokes: StrokeDto[] }>;
  size: [number, number];
  updated_at: string | null;
}

export interface AiQuestionDto {
  question_number?: number;
  question?: string;
  student_answer?: string;
  expected_solution?: string;
  analysis?: string;
  mistakes?: unknown[];
  error_categories?: unknown[];
  correct_answer?: string;
  suggestions?: unknown[];
  difficulty?: string;
  score?: number | null;
}

export interface AiSummaryDto {
  strengths?: unknown[];
  weaknesses?: unknown[];
  topics_to_review?: unknown[];
  recommendations?: unknown[];
}

export interface AiResultDto {
  overall_score?: number | null;
  grade?: string;
  questions?: AiQuestionDto[];
  summary?: AiSummaryDto | null;
}

export interface SubmissionDto {
  id: string | number;
  assignment_id: string | number;
  student_id: string | number;
  student_name: string;
  file_name: string;
  status: SubmissionStatus;
  overall_score: number | null;
  grade: string;
  error?: string;
  is_late?: boolean;
  created_at: string;
  checked_at: string | null;
  result?: AiResultDto | null;
  grade_value?: number | null;
  share_with_parent?: boolean;
  resubmit_comment?: string | null;
  comment?: string | null;
  teacher_comment?: string | null;
  files?: Array<{ name?: string | null; size?: number | null; mime?: string | null; index?: number | null }> | null;
  answers?: HomeworkAnswerDto[] | null;
  ai_state?: "checking" | "ready" | "failed" | "none" | null;
  ai_checking_since?: string | null;
}

export interface HomeworkQuestionDto {
  id: string | number;
  order?: number;
  type: HomeworkQuestionType;
  text: string;
  options?: string[] | null;
  correct?: number[] | null;
  points?: number | null;
}

export interface HomeworkAnswerDto {
  question_id: string | number;
  order?: number;
  type: HomeworkQuestionType;
  text: string;
  options?: string[] | null;
  points?: number | null;
  answer?: number[] | string | null;
  score?: number | null;
  correct?: number[] | null;
  is_correct?: boolean | null;
  ai_score?: number | null;
}

export interface HomeworkQuestionInput {
  type: HomeworkQuestionType;
  text: string;
  options: string[];
  correct: number[];
  points: number;
}

export interface SubmissionReviewInput {
  overallScore?: number | null;
  grade?: string;
  gradeValue?: number | null;
  shareWithParent?: boolean;
  result?: Record<string, unknown> | null;
  teacherComment?: string;
  answerScores?: Record<string, number>;
}

export interface HomeworkAnswerInput {
  questionId: string;
  answer: number[] | string;
}

export interface ResubmitRequestInput {
  id: string;
  comment: string;
}

export interface HomeworkAiSummaryDto {
  summary?: string;
  topics?: string[];
  recommendations?: string[];
  submissions_count?: number;
}

export interface AssignmentStatsDto {
  students_count?: number | null;
  submitted_count?: number | null;
  avg_score?: number | null;
}

export interface AssignmentDto {
  group_stats?: { average?: number | null; rank?: number | null; total?: number | null } | null;
  id: string | number;
  course_id: string | number | null;
  course_title: string | null;
  subject: string;
  subject_label?: string;
  title: string;
  description?: string;
  body?: string;
  attachment_name?: string;
  has_attachment?: boolean;
  google_form_url?: string | null;
  is_bank?: boolean;
  source_id?: string | number | null;
  copies_count?: number | null;
  questions_count?: number | null;
  student_ids?: Array<string | number> | null;
  due_at: string | null;
  skill_key?: string;
  lesson_id?: string | number | null;
  lesson_title?: string | null;
  created_at: string;
  submissions_count?: number | null;
  my_submission?: SubmissionDto | null;
  submissions?: SubmissionDto[];
  stats?: AssignmentStatsDto | null;
  status?: AssignmentStatus | "published";
  published?: boolean;
  announce_in_chat?: boolean;
  ai_group_summary?: {
    text?: string | null;
    summary?: string | null;
    topics?: string[] | null;
    recommendations?: string[] | null;
    submissions_count?: number | null;
    created_at?: string | null;
  } | null;
  allow_late?: boolean;
  ai_check?: boolean;
  attachment_size?: number | null;
  lesson_starts_at?: string | null;
  grading?: GradingScale;
  max_score?: number | null;
  questions?: HomeworkQuestionDto[] | null;
  has_questions?: boolean;
  questions_points?: number | null;
}

export interface HomeworkCourseReportDto {
  course_id?: string | number;
  id?: string | number;
  course_title?: string;
  title?: string;
  course_name?: string;
  assigned_count?: number | null;
  assignments_count?: number | null;
  assignments_total?: number | null;
  total_assignments?: number | null;
  submitted_count?: number | null;
  submissions_count?: number | null;
  assignments_submitted?: number | null;
  avg_score?: number | null;
  average_score?: number | null;
}

export type HomeworkReportDto =
  | HomeworkCourseReportDto[]
  | {
      courses?: HomeworkCourseReportDto[];
      subjects?: HomeworkCourseReportDto[];
      results?: HomeworkCourseReportDto[];
      overall?: HomeworkCourseReportDto;
      summary?: HomeworkCourseReportDto;
      total?: HomeworkCourseReportDto;
    };

export interface AssignmentFormInput {
  courseId: string | null;
  title: string;
  description?: string;
  body?: string;
  dueAt?: string;
  skillKey?: string;
  lessonId?: string | null;
  extraInstructions?: string;
  file?: File | null;
  status?: AssignmentStatus;
  announceInChat?: boolean;
  allowLate?: boolean;
  aiCheck?: boolean;
  grading?: GradingScale;
  maxScore?: number;
  questions?: HomeworkQuestionInput[];
  googleFormUrl?: string;
}

export interface AssignFromBankDto {
  count?: number;
  assignments?: AssignmentDto[];
}

export interface AssignTarget {
  courseId: string;
  studentIds: string[] | null;
}

export interface AssignFromBankInput {
  targets: AssignTarget[];
  dueAt: string | null;
  allowLate: boolean;
  announceInChat: boolean;
}

export interface AssignmentAudienceDto {
  restricted?: boolean;
  total?: number;
  assigned_count?: number;
  students?: Array<{
    id: string | number;
    name?: string;
    username?: string;
    assigned?: boolean;
    can_submit?: boolean;
    submitted?: boolean;
  }>;
}

export interface AssignmentAudience {
  restricted: boolean;
  total: number;
  assignedCount: number;
  students: Array<{ id: string; name: string; username: string; assigned: boolean; submitted: boolean }>;
}

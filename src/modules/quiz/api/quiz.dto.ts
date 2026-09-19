export interface QuizOptionDto {
  id: string | number;
  text: string;
  is_correct?: boolean;
  order?: number;
}

export type QuizQuestionTypeDto =
  | "single"
  | "multiple"
  | "true_false"
  | "numeric"
  | "text"
  | "matching"
  | "ordering"
  | "fill_blank";

export interface QuizChoiceItemDto {
  id: string | number;
  text: string;
}

export interface QuizQuestionDto {
  id: string | number;
  type?: QuizQuestionTypeDto;
  text: string;
  points: number;
  order: number;
  options: QuizOptionDto[];
  pairs_left?: QuizChoiceItemDto[];
  pairs_right?: QuizChoiceItemDto[];
  blank_count?: number;
  correct_bool?: boolean | null;
  accepted_answers?: string[] | null;
  tolerance?: number | null;
  case_sensitive?: boolean | null;
  pairs?: Array<{ left: string; right: string }> | null;
  items?: string[] | null;
  blanks?: Array<{ answers: string[] }> | null;
}

export interface QuizSummaryDto {
  id: string | number;
  course: string | number | null;
  subject?: string | null;
  subject_label?: string | null;
  lesson: string | number | null;
  title: string;
  description?: string;
  due_at: string | null;
  opens_at: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizDto extends QuizSummaryDto {
  questions: QuizQuestionDto[];
}

export interface QuizImportOptionDto {
  text: string;
  is_correct: boolean;
  order: number;
}

export interface QuizImportQuestionDto {
  text: string;
  order: number;
  options: QuizImportOptionDto[];
}

export interface QuizImportWarningDto {
  question_number: number;
  reason: string;
}

export interface QuizImportPreviewDto {
  title: string;
  description: string;
  questions: QuizImportQuestionDto[];
  warnings: QuizImportWarningDto[];
}

export interface QuizAttemptAnswerDto {
  question: string | number;
  question_text: string;
  question_type?: QuizQuestionTypeDto;
  selected_option: string | number | null;
  selected_option_text: string | null;
  is_correct: boolean;
  correct_option: { id: string | number; text: string } | null;
  points?: number | null;
  earned_points?: number | null;
  given_display?: string | null;
  correct_display?: string | null;
}

export interface QuizAttemptSummaryDto {
  id: string | number;
  quiz: string | number;
  student: string | number;
  student_name: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface QuizAttemptResultDto extends QuizAttemptSummaryDto {
  answers: QuizAttemptAnswerDto[];
}

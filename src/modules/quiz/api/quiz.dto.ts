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
  group?: string | number | null;
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
  topic?: string | null;
  status?: "draft" | "published";
  description?: string;
  due_at: string | null;
  opens_at: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizGroupDto {
  id: string | number;
  order: number;
  title?: string | null;
  passage?: string | null;
  audio_url?: string | null;
}

export interface QuizDto extends QuizSummaryDto {
  groups?: QuizGroupDto[];
  questions: QuizQuestionDto[];
  warnings?: QuizImportWarningDto[];
}

export interface QuizImportOptionDto {
  text: string;
  is_correct: boolean;
  order: number;
}

export interface QuizImportQuestionDto {
  text: string;
  type?: QuizQuestionTypeDto;
  order: number;
  options: QuizImportOptionDto[];
}

export interface QuizImportWarningDto {
  question_number: number;
  reason: string;
}

export type QuizImportSource = "docx" | "google_doc" | "google_form";

export interface QuizImportRequest {
  topic: string;
  courseId?: string | null;
  subject?: string;
  title?: string;
}

export type AiQuizStandard = "uzbmb" | "ielts" | "sat";
/** rules — imtihon qoidalari bo'yicha, simple — oddiy variantli, test_creator — eski yo'l */
export type AiQuizMode = "rules" | "simple" | "test_creator";
export type AiQuizJobStatus = "queued" | "processing" | "generating" | "done" | "failed";

export interface AiQuizRequest {
  topic: string;
  courseId?: string | null;
  subject?: string;
  title?: string;
  /** Faqat eski Test-creator yo'li uchun; bo'sh = imtihon qoidalari bo'yicha AI generator. */
  standard?: AiQuizStandard;
  questionCount: number;
  rulesFile?: File | null;
  rulesText?: string;
  /** Material matni (fayl o'rniga yoki fayllarga qo'shimcha). */
  materialText?: string;
  /** Imtihon nomi: AI uning rasmiy tuzilmasini o'zi eslaydi (qoidalar berilmasa). */
  examName?: string;
}

export interface AiQuizJobDto {
  id: string;
  status: AiQuizJobStatus;
  topic?: string;
  title?: string;
  standard?: AiQuizStandard | "";
  mode?: AiQuizMode;
  summary?: string;
  question_count?: number;
  quiz: string | number | null;
  error: string;
  warnings: QuizImportWarningDto[];
  created_at?: string;
}

export interface AiQuizJob {
  id: string;
  status: AiQuizJobStatus;
  topic: string;
  title: string;
  standard: AiQuizStandard | null;
  mode: AiQuizMode;
  summary: string;
  questionCount: number;
  quizId: string | null;
  error: string;
  createdAt: string;
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

import type { QuizQuestionDto } from "@/modules/quiz";

export interface ExamGroupDto {
  id: string;
  order: number;
  title?: string | null;
  passage?: string | null;
  audio_url?: string | null;
}

export type ExamItemKindDto = "section" | "break" | "offline";
export type ExamStateDto = "upcoming" | "running" | "finished" | "submitted";

export interface ExamTemplateItemDto {
  type: ExamItemKindDto;
  key: string;
  title?: string | null;
  minutes?: number | null;
  questions?: number | null;
  manual?: boolean;
  weight?: number | null;
}

export interface ExamTemplateDto {
  id: string;
  kind: "system" | "custom";
  name: string;
  description?: string | null;
  scoring?: { type?: string; scale?: number; pass_percent?: number | null } | null;
  items: ExamTemplateItemDto[];
}

export interface ExamSectionDto {
  order: number;
  kind: ExamItemKindDto;
  key: string;
  group?: string | null;
  title: string;
  minutes?: number | null;
  manual?: boolean;
  starts_at: string | null;
  ends_at: string | null;
  quiz?: string | null;
}

export interface ExamSummaryDto {
  id: string;
  course: string;
  course_title?: string | null;
  title: string;
  template_key: string;
  engine: string;
  starts_at: string;
  ends_at: string;
  total_minutes: number;
  state: Exclude<ExamStateDto, "submitted">;
  server_now: string;
}

export interface ExamDetailDto extends ExamSummaryDto {
  sections: ExamSectionDto[];
}

export interface ExamSavedAnswerDto {
  question: string | number;
  answer: Record<string, unknown>;
}

export interface ExamCurrentItemDto {
  kind: ExamItemKindDto;
  key: string;
  title: string;
  group?: string | null;
  minutes?: number | null;
  starts_at: string | null;
  ends_at: string | null;
  groups?: ExamGroupDto[];
  questions?: QuizQuestionDto[];
  saved?: ExamSavedAnswerDto[];
}

export interface ExamCurrentDto {
  server_now: string;
  state: ExamStateDto;
  starts_at: string;
  ends_at: string;
  item: ExamCurrentItemDto | null;
  next?: {
    kind: ExamItemKindDto;
    title: string;
    starts_at: string | null;
    ends_at: string | null;
  } | null;
}

export interface ExamTemplateFormValues {
  name: string;
  description: string;
  items: Array<{
    kind: "section" | "break";
    key: string;
    title: string;
    minutes: number;
    weight?: number;
  }>;
  scale: number;
  passPercent: number | null;
}

export interface ExamFormValues {
  courseId: string;
  templateId: string;
  title: string;
  startsAt: string;
  sections: Array<{ key: string; quizId: string; minutes?: number }>;
}

export interface ExamSectionResultDto {
  key: string;
  title?: string | null;
  earned?: number | null;
  max?: number | null;
  percent?: number | null;
  score?: number | null;
  scale_max?: number | null;
  manual?: boolean;
}

export interface ExamTotalResultDto {
  score?: number | null;
  max?: number | null;
  label?: string | null;
  range?: [number, number] | null;
  level?: string | null;
  passed?: boolean | null;
}

export interface ExamStudentResultDto {
  student: { id: string | number; username?: string | null; name?: string | null };
  participated: boolean;
  finished_at?: string | null;
  engine?: string | null;
  approximate?: boolean;
  sections?: ExamSectionResultDto[];
  total?: ExamTotalResultDto | null;
  pending?: string[];
}

export interface ExamResultsDto {
  exam?: string;
  engine?: string;
  state?: string;
  hidden?: boolean;
  results?: ExamStudentResultDto[];
}

export interface ExamAiCriteriaDto {
  task_response?: number | null;
  coherence_cohesion?: number | null;
  lexical_resource?: number | null;
  grammatical_range_accuracy?: number | null;
}

export interface ExamAiTaskDto {
  task_number: number;
  words?: number | null;
  min_words?: number | null;
  band?: number | null;
  criteria?: ExamAiCriteriaDto;
  strengths?: string[];
  weaknesses?: string[];
  corrections?: Array<{ original: string; corrected: string; explanation?: string | null }>;
  feedback?: string | null;
}

export interface ExamAiWritingDto {
  status?: "running" | "proposed" | "approved" | "failed";
  proposed_band?: number | null;
  approved_band?: number | null;
  error?: string | null;
  generated_at?: string | null;
  result?: {
    writing_band?: number | null;
    tasks?: ExamAiTaskDto[];
    summary?: { overall_comment?: string | null; recommendations?: string[] } | null;
  } | null;
}

export interface ExamManualAnswerDto {
  section: string;
  question: string;
  answer: string;
}

export interface ExamStudentResultDetailDto extends ExamStudentResultDto {
  manual_answers?: ExamManualAnswerDto[];
  ai?: { writing?: ExamAiWritingDto } | null;
}

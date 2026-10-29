export interface PracticeQuestionDto {
  text?: string | null;
  options?: string[] | null;
  correct_index?: number | null;
  explanation?: string | null;
}

export interface PracticeSetDto {
  topic?: string | null;
  questions?: PracticeQuestionDto[] | null;
  used?: number | null;
  limit?: number | null;
}

export interface AiExplanationDto {
  explanation?: string | null;
  tip?: string | null;
  used?: number | null;
  limit?: number | null;
}

export interface PracticeRequest {
  topic: string;
  count?: number;
  material?: string;
}

export interface ExplainRequest {
  question: string;
  wrongAnswer?: string;
  correctAnswer?: string;
}

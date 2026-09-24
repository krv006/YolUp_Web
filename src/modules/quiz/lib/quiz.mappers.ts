import type {
  QuizAnswerKey,
  QuizAnswerValue,
  QuizAttemptAnswer,
  QuizAttemptResult,
  QuizAttemptSummary,
  QuizDetail,
  QuizEditValues,
  QuizFormValues,
  QuizImportPreview,
  QuizImportWarning,
  QuizOption,
  QuizQuestion,
  QuizQuestionFormValues,
  QuizQuestionType,
  QuizSummary,
} from "@/shared/types";
import type {
  QuizAttemptAnswerDto,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizDto,
  QuizImportPreviewDto,
  QuizImportRequest,
  QuizImportWarningDto,
  QuizOptionDto,
  QuizQuestionDto,
  QuizSummaryDto,
} from "../api/quiz.dto";

export function mapQuizOptionDto(dto: QuizOptionDto): QuizOption {
  return { id: String(dto.id), text: dto.text, isCorrect: dto.is_correct };
}

const QUESTION_TYPES: ReadonlySet<QuizQuestionType> = new Set<QuizQuestionType>([
  "single",
  "multiple",
  "true_false",
  "numeric",
  "text",
  "matching",
  "ordering",
  "fill_blank",
]);

export function toQuestionType(value: unknown): QuizQuestionType {
  return QUESTION_TYPES.has(value as QuizQuestionType) ? (value as QuizQuestionType) : "single";
}

function mapAnswerKey(dto: QuizQuestionDto): QuizAnswerKey | undefined {
  const key: QuizAnswerKey = {};
  if (typeof dto.correct_bool === "boolean") key.correctBool = dto.correct_bool;
  if (dto.accepted_answers?.length) key.acceptedAnswers = dto.accepted_answers.map(String);
  if (typeof dto.tolerance === "number") key.tolerance = dto.tolerance;
  if (typeof dto.case_sensitive === "boolean") key.caseSensitive = dto.case_sensitive;
  if (dto.pairs?.length) key.pairs = dto.pairs.map((pair) => ({ left: pair.left, right: pair.right }));
  if (dto.items?.length) key.items = dto.items.map(String);
  if (dto.blanks?.length) key.blanks = dto.blanks.map((blank) => ({ answers: (blank.answers ?? []).map(String) }));
  return Object.keys(key).length ? key : undefined;
}

export function mapQuizQuestionDto(dto: QuizQuestionDto): QuizQuestion {
  return {
    id: String(dto.id),
    type: toQuestionType(dto.type),
    text: dto.text,
    points: Number(dto.points) || 0,
    order: dto.order,
    options: (dto.options ?? []).map(mapQuizOptionDto),
    matchLeft: (dto.pairs_left ?? []).map((item) => ({ id: String(item.id), text: item.text })),
    matchRight: (dto.pairs_right ?? []).map((item) => ({ id: String(item.id), text: item.text })),
    blankCount: Number(dto.blank_count ?? 0),
    answerKey: mapAnswerKey(dto),
  };
}

export function mapQuizSummaryDto(dto: QuizSummaryDto): QuizSummary {
  return {
    id: String(dto.id),
    courseId: dto.course == null ? "" : String(dto.course),
    subject: dto.subject || "",
    subjectLabel: dto.subject_label || dto.subject || "",
    lessonId: dto.lesson == null ? null : String(dto.lesson),
    title: dto.title,
    topic: dto.topic || "",
    status: dto.status === "draft" ? "draft" : "published",
    description: dto.description || "",
    dueAt: dto.due_at,
    opensAt: dto.opens_at,
    createdAt: dto.created_at,
    questionCount: dto.question_count,
  };
}

export function mapQuizDto(dto: QuizDto): QuizDetail {
  return {
    ...mapQuizSummaryDto(dto),
    questions: (dto.questions ?? []).map(mapQuizQuestionDto),
  };
}

export function mapQuizAttemptAnswerDto(dto: QuizAttemptAnswerDto): QuizAttemptAnswer {
  return {
    questionId: String(dto.question),
    questionText: dto.question_text,
    selectedOptionId: dto.selected_option == null ? null : String(dto.selected_option),
    selectedOptionText: dto.selected_option_text,
    questionType: toQuestionType(dto.question_type),
    isCorrect: dto.is_correct,
    correctOption: dto.correct_option
      ? { id: String(dto.correct_option.id), text: dto.correct_option.text }
      : null,
    points: dto.points ?? null,
    earnedPoints: dto.earned_points ?? null,
    givenDisplay: dto.given_display ?? null,
    correctDisplay: dto.correct_display ?? null,
  };
}

export function mapQuizAttemptSummaryDto(dto: QuizAttemptSummaryDto): QuizAttemptSummary {
  return {
    id: String(dto.id),
    quizId: String(dto.quiz),
    studentId: String(dto.student),
    studentName: dto.student_name,
    score: dto.score,
    maxScore: dto.max_score,
    createdAt: dto.created_at,
  };
}

export function mapQuizAttemptResultDto(dto: QuizAttemptResultDto): QuizAttemptResult {
  return {
    ...mapQuizAttemptSummaryDto(dto),
    answers: (dto.answers ?? []).map(mapQuizAttemptAnswerDto),
  };
}

export function mapQuizRequest(form: QuizFormValues): Record<string, unknown> {
  return {
    course: form.courseId || null,
    ...(form.subject ? { subject: form.subject } : {}),
    lesson: form.lessonId || null,
    title: form.title,
    topic: form.topic,
    ...(form.status ? { status: form.status } : {}),
    description: form.description || "",
    due_at: form.dueAt || null,
    opens_at: form.opensAt || null,
    questions: form.questions.map(mapQuestionRequest),
  };
}

export function mapQuizEditRequest(values: QuizEditValues): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (values.topic !== undefined) body.topic = values.topic;
  if (values.title !== undefined) body.title = values.title;
  if (values.description !== undefined) body.description = values.description;
  if (values.dueAt !== undefined) body.due_at = values.dueAt;
  if (values.opensAt !== undefined) body.opens_at = values.opensAt;
  if (values.questions !== undefined) body.questions = values.questions.map(mapQuestionRequest);
  return body;
}

export function mapQuestionRequest(question: QuizQuestionFormValues): Record<string, unknown> {
  const base = { type: question.type, text: question.text, points: question.points };
  switch (question.type) {
    case "single":
    case "multiple":
      return {
        ...base,
        options: question.options.map((option) => ({ text: option.text, is_correct: option.isCorrect })),
      };
    case "true_false":
      return { ...base, correct_bool: Boolean(question.correctBool) };
    case "numeric":
      return { ...base, accepted_answers: question.acceptedAnswers ?? [], tolerance: question.tolerance ?? 0 };
    case "text":
      return {
        ...base,
        accepted_answers: question.acceptedAnswers ?? [],
        case_sensitive: Boolean(question.caseSensitive),
      };
    case "matching":
      return { ...base, pairs: question.pairs ?? [] };
    case "ordering":
      return { ...base, items: question.items ?? [] };
    case "fill_blank":
      return { ...base, blanks: question.blanks ?? [] };
    default:
      return base;
  }
}

export function mapImportWarningDtos(
  dtos: QuizImportWarningDto[] | undefined
): QuizImportWarning[] {
  return (dtos ?? []).map((warning) => ({
    questionNumber: warning.question_number,
    reason: warning.reason,
  }));
}

export function mapQuizImportRequest(request: QuizImportRequest): Record<string, string> {
  const body: Record<string, string> = { topic: request.topic };
  if (request.courseId) body.course = request.courseId;
  if (request.subject) body.subject = request.subject;
  if (request.title) body.title = request.title;
  return body;
}

export function mapQuizImportPreviewDto(dto: QuizImportPreviewDto): QuizImportPreview {
  return {
    title: dto.title || "",
    description: dto.description || "",
    questions: (dto.questions ?? []).map((question) => ({
      type: toQuestionType(question.type),
      text: question.text,
      points: 2,
      options: (question.options ?? []).map((option) => ({
        text: option.text,
        isCorrect: option.is_correct,
      })),
    })),
    warnings: mapImportWarningDtos(dto.warnings),
  };
}

export interface QuizAttemptAnswerInput {
  questionId: string;
  answer: QuizAnswerValue;
}

function normalizeNumber(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(",", ".");
}

export function mapAttemptAnswerRequest({ questionId, answer }: QuizAttemptAnswerInput): Record<string, unknown> {
  const question = questionId;
  switch (answer.type) {
    case "single":
      return { question, selected_option: answer.optionId };
    case "multiple":
      return { question, selected_options: answer.optionIds };
    case "true_false":
      return { question, value_bool: answer.value };
    case "numeric":
      return { question, value_text: normalizeNumber(answer.value) };
    case "text":
      return { question, value_text: answer.value.trim() };
    case "matching":
      return {
        question,
        pairs: Object.entries(answer.pairs).map(([left, right]) => ({ left, right })),
      };
    case "ordering":
      return { question, order: answer.order };
    case "fill_blank":
      return { question, blanks: answer.values.map((value: string) => value.trim()) };
    default:
      return { question };
  }
}

export function mapQuizAttemptRequest(answers: QuizAttemptAnswerInput[]): Record<string, unknown> {
  return { answers: answers.map(mapAttemptAnswerRequest) };
}

export function quizDisplayTitle(quiz: { title: string; topic: string }): string {
  return quiz.title.trim() || quiz.topic.trim();
}

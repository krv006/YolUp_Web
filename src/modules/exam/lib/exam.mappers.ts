import { mapQuizQuestionDto } from "@/modules/quiz";
import type {
  ExamCurrent,
  ExamCurrentItem,
  ExamDetail,
  ExamItemKind,
  ExamQuestionGroup,
  ExamSection,
  ExamState,
  ExamSummary,
  ExamTemplate,
  ExamResults,
  ExamSectionResult,
  ExamAiWriting,
  ExamStudentResult,
  ExamStudentResultDetail,
  ExamTemplateItem,
  QuizAnswerValue,
  QuizQuestion,
} from "@/shared/types";
import type {
  ExamCurrentDto,
  ExamDetailDto,
  ExamFormValues,
  ExamGroupDto,
  ExamSavedAnswerDto,
  ExamSectionDto,
  ExamSummaryDto,
  ExamTemplateDto,
  ExamTemplateFormValues,
  ExamTemplateItemDto,
  ExamResultsDto,
  ExamSectionResultDto,
  ExamStudentResultDetailDto,
  ExamStudentResultDto,
} from "../api/exam.dto";

const ITEM_KINDS: ReadonlySet<ExamItemKind> = new Set<ExamItemKind>(["section", "break", "offline"]);

function toItemKind(value: unknown): ExamItemKind {
  return ITEM_KINDS.has(value as ExamItemKind) ? (value as ExamItemKind) : "section";
}

export function mapExamTemplateItemDto(dto: ExamTemplateItemDto): ExamTemplateItem {
  return {
    kind: toItemKind(dto.type),
    key: dto.key,
    title: dto.title || dto.key,
    minutes: dto.minutes ?? null,
    questions: dto.questions ?? null,
    manual: Boolean(dto.manual),
    weight: dto.weight ?? 1,
  };
}

export function mapExamTemplateDto(dto: ExamTemplateDto): ExamTemplate {
  return {
    id: String(dto.id),
    kind: dto.kind === "custom" ? "custom" : "system",
    name: dto.name,
    description: dto.description || "",
    scoringType: dto.scoring?.type || "percent",
    scale: dto.scoring?.scale ?? null,
    passPercent: dto.scoring?.pass_percent ?? null,
    items: (dto.items ?? []).map(mapExamTemplateItemDto),
  };
}

export function mapExamSectionDto(dto: ExamSectionDto): ExamSection {
  return {
    order: dto.order,
    kind: toItemKind(dto.kind),
    key: dto.key,
    group: dto.group || "",
    title: dto.title,
    minutes: dto.minutes ?? null,
    manual: Boolean(dto.manual),
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    quizId: dto.quiz ? String(dto.quiz) : null,
  };
}

export function mapExamSummaryDto(dto: ExamSummaryDto): ExamSummary {
  return {
    id: String(dto.id),
    courseId: String(dto.course),
    courseTitle: dto.course_title || "",
    title: dto.title,
    templateKey: dto.template_key,
    engine: dto.engine,
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    totalMinutes: Number(dto.total_minutes) || 0,
    state: dto.state,
    serverNow: dto.server_now,
  };
}

export function mapExamDetailDto(dto: ExamDetailDto): ExamDetail {
  return { ...mapExamSummaryDto(dto), sections: (dto.sections ?? []).map(mapExamSectionDto) };
}

function mapGroupDto(dto: ExamGroupDto): ExamQuestionGroup {
  return {
    id: String(dto.id),
    order: dto.order,
    title: dto.title || "",
    passage: dto.passage || "",
    audioUrl: dto.audio_url || null,
  };
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function mapSavedAnswer(
  question: QuizQuestion,
  answer: Record<string, unknown> | undefined
): QuizAnswerValue | null {
  if (!answer) return null;
  switch (question.type) {
    case "single":
      return answer.selected_option == null
        ? null
        : { type: "single", optionId: String(answer.selected_option) };
    case "multiple":
      return { type: "multiple", optionIds: toStringList(answer.selected_options) };
    case "true_false":
      return typeof answer.value_bool === "boolean"
        ? { type: "true_false", value: answer.value_bool }
        : null;
    case "numeric":
      return { type: "numeric", value: String(answer.value_text ?? "") };
    case "text":
      return { type: "text", value: String(answer.value_text ?? "") };
    case "matching": {
      const pairs: Record<string, string> = {};
      for (const pair of Array.isArray(answer.pairs) ? answer.pairs : []) {
        const item = pair as { left?: unknown; right?: unknown };
        if (item.left != null && item.right != null) pairs[String(item.left)] = String(item.right);
      }
      return { type: "matching", pairs };
    }
    case "ordering":
      return { type: "ordering", order: toStringList(answer.order) };
    case "fill_blank":
      return { type: "fill_blank", values: toStringList(answer.blanks) };
    default:
      return null;
  }
}

function mapSavedAnswers(
  questions: QuizQuestion[],
  saved: ExamSavedAnswerDto[] | undefined
): Record<string, QuizAnswerValue> {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const answers: Record<string, QuizAnswerValue> = {};
  for (const entry of saved ?? []) {
    const question = byId.get(String(entry.question));
    if (!question) continue;
    const value = mapSavedAnswer(question, entry.answer);
    if (value) answers[question.id] = value;
  }
  return answers;
}

export function mapExamCurrentDto(dto: ExamCurrentDto): ExamCurrent {
  const item = dto.item;
  let current: ExamCurrentItem | null = null;
  if (item) {
    const questions = (item.questions ?? []).map(mapQuizQuestionDto);
    current = {
      kind: toItemKind(item.kind),
      key: item.key,
      title: item.title,
      minutes: item.minutes ?? null,
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      groups: (item.groups ?? []).map(mapGroupDto),
      questions,
      savedAnswers: mapSavedAnswers(questions, item.saved),
    };
  }
  return {
    serverNow: dto.server_now,
    state: (dto.state ?? "upcoming") as ExamState,
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    item: current,
    next: dto.next
      ? {
          kind: toItemKind(dto.next.kind),
          title: dto.next.title,
          startsAt: dto.next.starts_at,
          endsAt: dto.next.ends_at,
        }
      : null,
  };
}

export function mapExamTemplateRequest(form: ExamTemplateFormValues): Record<string, unknown> {
  return {
    name: form.name,
    description: form.description,
    items: form.items.map((item) => ({
      type: item.kind,
      key: item.key,
      title: item.title,
      minutes: item.minutes,
      ...(item.kind === "section" && item.weight ? { weight: item.weight } : {}),
    })),
    scoring: {
      scale: form.scale,
      ...(form.passPercent === null ? {} : { pass_percent: form.passPercent }),
    },
  };
}

export function toIsoDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function mapExamRequest(form: ExamFormValues): Record<string, unknown> {
  return {
    course: form.courseId,
    template: form.templateId,
    title: form.title,
    starts_at: toIsoDateTime(form.startsAt),
    sections: form.sections.map((section) => ({
      key: section.key,
      quiz: section.quizId,
      ...(section.minutes ? { minutes: section.minutes } : {}),
    })),
  };
}

function mapSectionResultDto(dto: ExamSectionResultDto): ExamSectionResult {
  return {
    key: dto.key,
    title: dto.title || dto.key,
    earned: dto.earned ?? null,
    max: dto.max ?? null,
    percent: dto.percent ?? null,
    score: dto.score ?? null,
    scaleMax: dto.scale_max ?? null,
    manual: Boolean(dto.manual),
  };
}

export function mapExamStudentResultDto(dto: ExamStudentResultDto): ExamStudentResult {
  return {
    studentId: String(dto.student?.id ?? ""),
    studentName: dto.student?.name || dto.student?.username || "",
    username: dto.student?.username || "",
    participated: Boolean(dto.participated),
    finishedAt: dto.finished_at ?? null,
    approximate: Boolean(dto.approximate),
    sections: (dto.sections ?? []).map(mapSectionResultDto),
    total: dto.total
      ? {
          score: dto.total.score ?? null,
          max: dto.total.max ?? null,
          label: dto.total.label || "",
          range: dto.total.range ?? null,
          level: dto.total.level ?? null,
          passed: dto.total.passed ?? null,
        }
      : null,
    pending: dto.pending ?? [],
  };
}

export function mapExamResultsDto(dto: ExamResultsDto): ExamResults {
  return {
    hidden: Boolean(dto.hidden),
    engine: dto.engine || "",
    state: dto.state || "",
    results: (dto.results ?? []).map(mapExamStudentResultDto),
  };
}

const AI_CRITERIA = [
  "task_response",
  "coherence_cohesion",
  "lexical_resource",
  "grammatical_range_accuracy",
] as const;

function mapAiWriting(dto: ExamStudentResultDetailDto["ai"]): ExamAiWriting | null {
  const writing = dto?.writing;
  if (!writing || !writing.status) return null;
  const result = writing.result ?? null;
  return {
    status: writing.status,
    proposedBand: writing.proposed_band ?? null,
    approvedBand: writing.approved_band ?? null,
    error: writing.error || "",
    generatedAt: writing.generated_at ?? null,
    writingBand: result?.writing_band ?? null,
    tasks: (result?.tasks ?? []).map((task) => ({
      taskNumber: task.task_number,
      words: task.words ?? null,
      minWords: task.min_words ?? null,
      band: task.band ?? null,
      criteria: AI_CRITERIA.map((key) => ({ key, score: task.criteria?.[key] ?? null })),
      strengths: task.strengths ?? [],
      weaknesses: task.weaknesses ?? [],
      corrections: (task.corrections ?? []).map((item) => ({
        original: item.original,
        corrected: item.corrected,
        explanation: item.explanation || "",
      })),
      feedback: task.feedback || "",
    })),
    overallComment: result?.summary?.overall_comment || "",
    recommendations: result?.summary?.recommendations ?? [],
  };
}

export function mapExamStudentResultDetailDto(
  dto: ExamStudentResultDetailDto
): ExamStudentResultDetail {
  return {
    ...mapExamStudentResultDto(dto),
    manualAnswers: (dto.manual_answers ?? []).map((item) => ({
      section: item.section,
      question: item.question,
      answer: item.answer,
    })),
    ai: mapAiWriting(dto.ai),
  };
}

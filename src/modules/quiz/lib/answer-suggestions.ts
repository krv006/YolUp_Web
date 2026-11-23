import type { QuestionDraft } from "./question-draft";

export type SuggestionConfidence = "high" | "medium" | "low";

/** Backend taklifi (`POST /quizzes/{id}/suggest-answers/`): savol raqami (1 dan) va to'g'ri variant indekslari (0 dan). */
export interface AnswerSuggestion {
  number: number;
  questionId: string;
  correct: number[];
  confidence: SuggestionConfidence;
}

export interface AnswerSuggestionResult {
  asked: number;
  skipped: number;
  suggestions: AnswerSuggestion[];
}

/** To'g'ri javobi belgilanmagan variantli savol: AI taklifi shunga beriladi. */
export function needsAnswer(draft: QuestionDraft): boolean {
  return (
    (draft.type === "single" || draft.type === "multiple") &&
    draft.options.length >= 2 &&
    draft.correctKeys.length === 0
  );
}

export function unansweredCount(drafts: QuestionDraft[]): number {
  return drafts.filter(needsAnswer).length;
}

/**
 * Takliflarni savollarga qo'llaydi (faqat hali javobsiz savollarga; o'qituvchi belgilagan javob hech qachon
 * almashtirilmaydi). Qaytaradi: yangi ro'yxat va qaysi savolga qanday ishonch bilan taklif berilgani.
 */
export function applySuggestions(
  drafts: QuestionDraft[],
  suggestions: AnswerSuggestion[]
): { drafts: QuestionDraft[]; applied: Record<string, SuggestionConfidence> } {
  const applied: Record<string, SuggestionConfidence> = {};
  const next = drafts.slice();
  for (const suggestion of suggestions) {
    const index = suggestion.number - 1;
    const draft = next[index];
    if (!draft || !needsAnswer(draft)) continue;
    const keys = suggestion.correct
      .filter((position) => Number.isInteger(position) && position >= 0 && position < draft.options.length)
      .map((position) => draft.options[position].key);
    const chosen = draft.type === "single" ? keys.slice(0, 1) : keys;
    if (!chosen.length) continue;
    next[index] = { ...draft, correctKeys: chosen };
    applied[draft.key] = suggestion.confidence;
  }
  return { drafts: next, applied };
}

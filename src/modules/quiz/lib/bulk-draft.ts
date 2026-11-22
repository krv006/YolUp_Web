import type { QuizQuestionType } from "@/shared/types";
import {
  createDraft,
  hasDraftContent,
  validateDraft,
  type DraftError,
  type KeyFactory,
  type QuestionDraft,
} from "./question-draft";

/** Qo'lda yozish sahifasidagi savol holati: bo'sh (hali tegilmagan), to'liq emas, tayyor. */
export type DraftState = "empty" | "partial" | "ready";

export interface DraftStatus {
  state: DraftState;
  error: DraftError | null;
}

export function draftStatus(draft: QuestionDraft): DraftStatus {
  const touched =
    hasDraftContent(draft) ||
    draft.correctBool !== null ||
    draft.correctKeys.length > 0 ||
    Boolean(draft.image) ||
    Boolean(draft.textAfter.trim());
  if (!touched) return { state: "empty", error: null };
  const error = validateDraft(draft);
  return { state: error ? "partial" : "ready", error };
}

export function summarizeDrafts(drafts: QuestionDraft[]): Record<DraftState, number> {
  const total: Record<DraftState, number> = { empty: 0, partial: 0, ready: 0 };
  for (const draft of drafts) total[draftStatus(draft).state] += 1;
  return total;
}

export function createBlankDrafts(count: number, type: QuizQuestionType, newKey: KeyFactory): QuestionDraft[] {
  return Array.from({ length: Math.max(0, count) }, () => createDraft(type, newKey));
}

/**
 * Umumiy tur o'zgarganda: faqat BO'SH savollar yangi turga o'tadi (yozilgan savol buzilmasin).
 * `includeFilled` bo'lsa yozilganlari ham (matn va rasm saqlanadi, tur javoblari qayta boshlanadi).
 */
export function retypeDrafts(
  drafts: QuestionDraft[],
  type: QuizQuestionType,
  newKey: KeyFactory,
  includeFilled = false
): { drafts: QuestionDraft[]; changed: number } {
  let changed = 0;
  const next = drafts.map((draft) => {
    if (draft.type === type) return draft;
    if (!includeFilled && draftStatus(draft).state !== "empty") return draft;
    changed += 1;
    return { ...createDraft(type, newKey), key: draft.key, text: draft.text, image: draft.image, textAfter: draft.textAfter, points: draft.points };
  });
  return { drafts: next, changed };
}

export function moveDraft(drafts: QuestionDraft[], key: string, delta: -1 | 1): QuestionDraft[] {
  const from = drafts.findIndex((draft) => draft.key === key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= drafts.length) return drafts;
  const next = drafts.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function insertDraft(drafts: QuestionDraft[], index: number, draft: QuestionDraft): QuestionDraft[] {
  const at = Math.min(Math.max(index, 0), drafts.length);
  return [...drafts.slice(0, at), draft, ...drafts.slice(at)];
}

/** Savolning nusxasi: barcha ichki kalitlar yangilanadi, to'g'ri javob belgilari yangi variantlarga ko'chadi. */
export function cloneDraft(draft: QuestionDraft, newKey: KeyFactory): QuestionDraft {
  const optionKeys = new Map<string, string>();
  const options = draft.options.map((option) => {
    const key = newKey();
    optionKeys.set(option.key, key);
    return { ...option, key };
  });
  return {
    ...draft,
    key: newKey(),
    options,
    correctKeys: draft.correctKeys.map((key) => optionKeys.get(key) ?? key),
    pairs: draft.pairs.map((pair) => ({ ...pair, key: newKey() })),
    acceptedAnswers: draft.acceptedAnswers.slice(),
  };
}

export function insertAfter(drafts: QuestionDraft[], key: string, draft: QuestionDraft): QuestionDraft[] {
  const index = drafts.findIndex((item) => item.key === key);
  return insertDraft(drafts, index < 0 ? drafts.length : index + 1, draft);
}

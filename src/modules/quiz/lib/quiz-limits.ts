import type { QuizSummary } from "@/shared/types";

export const QUIZ_TIME_LIMIT_MAX = 600;
export const QUIZ_ATTEMPTS_MAX = 20;

export interface QuizLimitsDraft {
  time: string;
  attempts: string;
  perAttempt: string;
}

export interface QuizLimits {
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  questionsPerAttempt: number | null;
}

export type QuizLimitField = keyof QuizLimitsDraft;

export function quizLimitsDraft(
  quiz: Pick<QuizSummary, "timeLimitMinutes" | "maxAttempts" | "questionsPerAttempt"> | null | undefined
): QuizLimitsDraft {
  return {
    time: quiz?.timeLimitMinutes ? String(quiz.timeLimitMinutes) : "",
    attempts: quiz?.maxAttempts ? String(quiz.maxAttempts) : "",
    perAttempt: quiz?.questionsPerAttempt ? String(quiz.questionsPerAttempt) : "",
  };
}

function readNumber(text: string, max: number): { value: number | null; invalid: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { value: null, invalid: false };
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1 || value > max) return { value: null, invalid: true };
  return { value, invalid: false };
}

export function parseQuizLimits(
  draft: QuizLimitsDraft,
  { questionCount, hasGroups }: { questionCount: number; hasGroups: boolean }
): { limits: QuizLimits; invalid: QuizLimitField[] } {
  const time = readNumber(draft.time, QUIZ_TIME_LIMIT_MAX);
  const attempts = readNumber(draft.attempts, QUIZ_ATTEMPTS_MAX);
  const perAttempt = hasGroups ? { value: null, invalid: false } : readNumber(draft.perAttempt, Math.max(questionCount, 1));
  const invalid: QuizLimitField[] = [];
  if (time.invalid) invalid.push("time");
  if (attempts.invalid) invalid.push("attempts");
  if (perAttempt.invalid) invalid.push("perAttempt");
  return {
    limits: { timeLimitMinutes: time.value, maxAttempts: attempts.value, questionsPerAttempt: perAttempt.value },
    invalid,
  };
}

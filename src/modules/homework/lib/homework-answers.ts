import type { HomeworkQuestion } from "@/shared/types";
import type { HomeworkAnswerInput } from "../api/homework.dto";

export type AnswerDraft = Record<string, number[] | string>;

export function isAnswered(value: number[] | string | undefined): boolean {
  if (value === undefined) return false;
  return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
}

export function answerInputs(questions: HomeworkQuestion[], draft: AnswerDraft): HomeworkAnswerInput[] {
  return questions
    .filter((question) => isAnswered(draft[question.id]))
    .map((question) => {
      const value = draft[question.id];
      return { questionId: question.id, answer: Array.isArray(value) ? value : value.trim() };
    });
}

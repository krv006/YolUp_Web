import type { HomeworkQuestion, HomeworkQuestionType } from "@/shared/types";
import type { HomeworkQuestionInput } from "../api/homework.dto";

export const MAX_QUESTIONS = 100;
export const MAX_OPTIONS = 10;
export const MAX_POINTS = 1000;
export const TEST_TYPES: HomeworkQuestionType[] = ["single", "multiple"];

export interface DraftQuestion extends HomeworkQuestionInput {
  key: string;
}

export type QuestionIssue = "text" | "options" | "correct" | "points";

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `q${counter}`;
}

export function isTestQuestion(type: HomeworkQuestionType): boolean {
  return TEST_TYPES.includes(type);
}

export function emptyQuestion(type: HomeworkQuestionType = "single"): DraftQuestion {
  return { key: nextKey(), type, text: "", options: isTestQuestion(type) ? ["", ""] : [], correct: [], points: 1 };
}

export function draftsFromQuestions(questions: HomeworkQuestion[]): DraftQuestion[] {
  return questions.map((question) => ({
    key: nextKey(),
    type: question.type,
    text: question.text,
    options: [...question.options],
    correct: [...(question.correct ?? [])],
    points: question.points,
  }));
}

export function changeType(question: DraftQuestion, type: HomeworkQuestionType): DraftQuestion {
  if (!isTestQuestion(type)) return { ...question, type, options: [], correct: [] };
  const options = question.options.length >= 2 ? question.options : ["", ""];
  const correct = type === "single" ? question.correct.slice(0, 1) : question.correct;
  return { ...question, type, options, correct };
}

export function removeOption(question: DraftQuestion, index: number): DraftQuestion {
  return {
    ...question,
    options: question.options.filter((_, position) => position !== index),
    correct: question.correct.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item)),
  };
}

export function toggleCorrect(question: DraftQuestion, index: number): DraftQuestion {
  if (question.type === "single") return { ...question, correct: [index] };
  return {
    ...question,
    correct: question.correct.includes(index)
      ? question.correct.filter((item) => item !== index)
      : [...question.correct, index].sort((a, b) => a - b),
  };
}

export function questionIssue(question: DraftQuestion): QuestionIssue | null {
  if (!question.text.trim()) return "text";
  if (!Number.isInteger(question.points) || question.points < 1 || question.points > MAX_POINTS) return "points";
  if (!isTestQuestion(question.type)) return null;
  if (question.options.length < 2 || question.options.some((option) => !option.trim())) return "options";
  if (question.type === "single" ? question.correct.length !== 1 : question.correct.length < 1) return "correct";
  return null;
}

export function toQuestionInputs(drafts: DraftQuestion[]): HomeworkQuestionInput[] {
  return drafts.map((draft) => ({
    type: draft.type,
    text: draft.text.trim(),
    options: isTestQuestion(draft.type) ? draft.options.map((option) => option.trim()) : [],
    correct: isTestQuestion(draft.type) ? draft.correct : [],
    points: draft.points,
  }));
}

export function totalPoints(drafts: Array<{ points: number }>): number {
  return drafts.reduce((sum, item) => sum + (Number.isFinite(item.points) ? item.points : 0), 0);
}

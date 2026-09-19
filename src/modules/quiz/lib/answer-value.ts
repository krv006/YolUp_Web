import type { QuizAnswerValue, QuizQuestion } from "@/shared/types";

export function emptyAnswer(question: QuizQuestion): QuizAnswerValue {
  switch (question.type) {
    case "multiple":
      return { type: "multiple", optionIds: [] };
    case "true_false":
      return { type: "true_false", value: null };
    case "numeric":
      return { type: "numeric", value: "" };
    case "text":
      return { type: "text", value: "" };
    case "matching":
      return { type: "matching", pairs: {} };
    case "ordering":
      return { type: "ordering", order: question.options.map((option) => option.id) };
    case "fill_blank":
      return { type: "fill_blank", values: Array.from({ length: question.blankCount }, () => "") };
    default:
      return { type: "single", optionId: null };
  }
}

export function blankTextForDisplay(text: string): string {
  return text.replace(/\{\{\d+\}\}/g, "____");
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return result;
}

export function stableShuffle<T extends { id: string }>(items: readonly T[], seed: string): T[] {
  const shuffled = [...items].sort((a, b) => hash(`${seed}${a.id}`) - hash(`${seed}${b.id}`));
  const unchanged = shuffled.every((item, index) => item.id === items[index].id);
  return unchanged && items.length > 1 ? [...shuffled.slice(1), shuffled[0]] : shuffled;
}

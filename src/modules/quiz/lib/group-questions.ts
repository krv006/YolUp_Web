import type { QuizGroup, QuizQuestion } from "@/shared/types";

export interface QuestionBlock {
  group: QuizGroup | null;
  questions: QuizQuestion[];
}

export function groupQuestions(questions: QuizQuestion[], groups: QuizGroup[]): QuestionBlock[] {
  if (!groups.length) return questions.length ? [{ group: null, questions }] : [];

  const byGroup = new Map<string, QuizQuestion[]>();
  const plain: QuizQuestion[] = [];
  for (const question of questions) {
    if (!question.groupId) {
      plain.push(question);
      continue;
    }
    const list = byGroup.get(question.groupId) ?? [];
    list.push(question);
    byGroup.set(question.groupId, list);
  }

  const blocks: QuestionBlock[] = [];
  for (const group of groups) {
    const list = byGroup.get(group.id);
    if (list?.length) blocks.push({ group, questions: list });
  }
  if (plain.length) blocks.push({ group: null, questions: plain });
  return blocks;
}

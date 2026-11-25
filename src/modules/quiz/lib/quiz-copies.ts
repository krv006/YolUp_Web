import type { QuizSummary } from "@/shared/types";

export function copiesBySource(quizzes: readonly Pick<QuizSummary, "sourceQuizId">[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const quiz of quizzes) {
    if (quiz.sourceQuizId) counts.set(quiz.sourceQuizId, (counts.get(quiz.sourceQuizId) ?? 0) + 1);
  }
  return counts;
}

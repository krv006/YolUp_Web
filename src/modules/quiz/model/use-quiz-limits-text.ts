import { useTranslation } from "react-i18next";
import type { QuizSummary } from "@/shared/types";

export function useQuizLimitsText() {
  const { t } = useTranslation("quiz");
  return (quiz: Pick<QuizSummary, "timeLimitMinutes" | "maxAttempts" | "questionsPerAttempt"> | null | undefined) =>
    quiz
      ? [
          quiz.timeLimitMinutes ? t("limits.short.time", { count: quiz.timeLimitMinutes }) : "",
          quiz.maxAttempts ? t("limits.short.attempts", { count: quiz.maxAttempts }) : "",
          quiz.questionsPerAttempt ? t("limits.short.perAttempt", { count: quiz.questionsPerAttempt }) : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
}

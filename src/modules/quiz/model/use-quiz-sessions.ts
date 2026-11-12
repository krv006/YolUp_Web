import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { QuizSummary } from "@/shared/types";
import { runningSessions } from "../lib/countdown";
import { quizKeys } from "./quiz.queries";

export function useQuizSessionsLeft(quizzes: readonly QuizSummary[]): ReadonlyMap<string, number> {
  const client = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const running = runningSessions(quizzes, now);
  const hasSessions = quizzes.some((quiz) => quiz.sessionEndsAt);
  const ended = quizzes
    .filter((quiz) => quiz.sessionEndsAt && !running.has(quiz.id))
    .map((quiz) => `${quiz.id}@${quiz.sessionEndsAt}`)
    .join("|");

  useEffect(() => {
    if (!hasSessions) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [hasSessions]);

  useEffect(() => {
    if (ended) client.invalidateQueries({ queryKey: quizKeys.lists });
  }, [client, ended]);

  return running;
}

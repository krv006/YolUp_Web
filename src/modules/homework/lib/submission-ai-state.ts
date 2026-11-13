import type { AiCheckState, Submission } from "@/shared/types";

export function submissionAiState(
  submission: Pick<Submission, "aiState" | "status" | "result" | "error" | "overallScore">
): AiCheckState {
  if (submission.aiState) return submission.aiState;
  if (submission.status === "checking") return "checking";
  if (submission.result) return (submission.overallScore ?? submission.result.overallScore) == null ? "unscored" : "ready";
  if (submission.status === "error" || submission.error) return "failed";
  return "none";
}

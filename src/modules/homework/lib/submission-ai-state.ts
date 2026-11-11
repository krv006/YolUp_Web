import type { AiCheckState, Submission } from "@/shared/types";

export function submissionAiState(submission: Pick<Submission, "aiState" | "status" | "result" | "error">): AiCheckState {
  if (submission.aiState) return submission.aiState;
  if (submission.status === "checking") return "checking";
  if (submission.result) return "ready";
  if (submission.status === "error" || submission.error) return "failed";
  return "none";
}

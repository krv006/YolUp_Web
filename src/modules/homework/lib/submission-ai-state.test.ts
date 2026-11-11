import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import type { Submission } from "@/shared/types";
import { homeworkApi } from "../api/homework.api";
import type { SubmissionDto } from "../api/homework.dto";
import { mapSubmissionDto } from "./homework.mappers";
import { submissionAiState } from "./submission-ai-state";

afterEach(() => vi.restoreAllMocks());

const dto = (patch: Partial<SubmissionDto>): SubmissionDto => ({
  id: "s1",
  assignment_id: "a1",
  student_id: "u1",
  student_name: "Bekzod",
  file_name: "",
  status: "pending_review",
  overall_score: null,
  grade: "",
  created_at: "2026-11-11T10:00:00Z",
  checked_at: null,
  ...patch,
});

function map(patch: Partial<SubmissionDto>): Submission {
  const submission = mapSubmissionDto(dto(patch));
  if (!submission) throw new Error("submission was not mapped");
  return submission;
}

describe("text-only homework", () => {
  it("has nothing to download when the student only wrote a comment", () => {
    const submission = map({ files: [], comment: "Javobim shu" });
    expect(submission.files).toEqual([]);
    expect(submission.comment).toBe("Javobim shu");
  });

  it("still lists the single file of an older submission", () => {
    expect(map({ file_name: "uy.pdf" }).files).toEqual([{ name: "uy.pdf", size: null, mimeType: "", index: 0 }]);
  });

  it("sends a comment-only answer and refuses an empty one", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(dto({ files: [], comment: "Javobim" }));
    await homeworkApi.submit("a1", [], undefined, "  Javobim  ");
    const body = post.mock.calls[0][1] as FormData;
    expect(body.has("file")).toBe(false);
    expect(body.get("comment")).toBe("Javobim");

    await expect(homeworkApi.submit("a1", [], undefined, "   ")).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("submissionAiState", () => {
  it("follows the state the server reports", () => {
    expect(submissionAiState(map({ ai_state: "failed", error: "AI baholay olmadi" }))).toBe("failed");
    expect(submissionAiState(map({ ai_state: "none" }))).toBe("none");
    expect(map({ ai_state: "checking", ai_checking_since: "2026-11-11T10:01:00Z" }).aiCheckingSince).toBe(
      "2026-11-11T10:01:00Z"
    );
  });

  it("works it out when the server does not say", () => {
    expect(submissionAiState(map({ status: "checking" }))).toBe("checking");
    expect(submissionAiState(map({ result: { overall_score: 70 } }))).toBe("ready");
    expect(submissionAiState(map({ error: "AI baholay olmadi" }))).toBe("failed");
    expect(submissionAiState(map({}))).toBe("none");
  });
});

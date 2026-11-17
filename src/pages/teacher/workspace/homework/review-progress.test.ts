import { describe, expect, it } from "vitest";
import type { Submission } from "@/shared/types";
import { nextPendingSubmission, reviewedCount } from "./review-progress";

const row = (id: string, status: string) => ({ id, status }) as Submission;

describe("review progress", () => {
  const rows = [
    row("a", "done"),
    row("b", "pending_review"),
    row("c", "pending_review"),
    row("d", "resubmit_requested"),
    row("e", "checking"),
  ];

  it("moves to the next work that still needs review, wrapping to the start", () => {
    expect(nextPendingSubmission(rows, "c")?.id).toBe("e");
    expect(nextPendingSubmission(rows, "e")?.id).toBe("b");
  });

  it("skips graded and resubmit-requested work and finds nothing when all is handled", () => {
    expect(nextPendingSubmission(rows, "a")?.id).toBe("b");
    expect(nextPendingSubmission([row("x", "done"), row("y", "pending_review")], "y")).toBeNull();
  });

  it("counts the current work as reviewed together with already handled ones", () => {
    expect(reviewedCount(rows, "b")).toBe(3);
    expect(reviewedCount(rows, "a")).toBe(2);
  });
});

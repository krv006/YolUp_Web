import { describe, expect, it } from "vitest";
import type { Submission } from "@/shared/types";
import { latestSubmission } from "./latest-submission";

const submission = (id: string, createdAt: string) => ({ id, createdAt }) as Submission;

describe("latestSubmission", () => {
  it("returns nothing when the student has not submitted", () => {
    expect(latestSubmission([])).toBeNull();
  });

  it("picks the newest submission whatever the order", () => {
    const list = [
      submission("old", "2026-11-14T10:00:00Z"),
      submission("new", "2026-11-17T09:30:00Z"),
      submission("mid", "2026-11-15T08:00:00Z"),
    ];
    expect(latestSubmission(list)?.id).toBe("new");
  });
});

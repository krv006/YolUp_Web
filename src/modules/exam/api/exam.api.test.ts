import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { examApi } from "./exam.api";

const result = {
  student: { id: "s1", name: "Aziza", username: "aziza", avatar: null },
  participated: true,
  sections: [],
  teacher_comment: "Writing Task 2 ni kuchaytiring",
};

afterEach(() => vi.restoreAllMocks());

describe("examApi.saveManualScores", () => {
  it("sends the teacher note together with the manual bands", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(result);
    const saved = await examApi.saveManualScores("e1", "s1", { writing: 6.5 }, "Writing Task 2 ni kuchaytiring");
    expect(put).toHaveBeenCalledWith("/api/v1/exams/e1/results/s1/manual/", {
      scores: { writing: 6.5 },
      comment: "Writing Task 2 ni kuchaytiring",
    });
    expect(saved.teacherComment).toBe("Writing Task 2 ni kuchaytiring");
  });

  it("leaves the existing note untouched when no comment is given", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(result);
    await examApi.saveManualScores("e1", "s1", { speaking: 7 });
    expect(put).toHaveBeenCalledWith("/api/v1/exams/e1/results/s1/manual/", { scores: { speaking: 7 } });
  });
});

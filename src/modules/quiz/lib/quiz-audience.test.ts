import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { quizApi } from "../api/quiz.api";
import { assignRequestBody, mapQuizAudienceDto, mapQuizSummaryDto } from "./quiz.mappers";

afterEach(() => vi.restoreAllMocks());

const summary = {
  id: "q1",
  course: null,
  lesson: null,
  title: "Test",
  due_at: null,
  opens_at: null,
  question_count: 5,
  created_at: "2026-11-11T09:00:00Z",
};

describe("quiz audience", () => {
  it("reads null student ids as everyone and keeps a group-less test", () => {
    expect(mapQuizSummaryDto({ ...summary, student_ids: null })).toMatchObject({ courseId: "", studentIds: null });
    expect(mapQuizSummaryDto({ ...summary, student_ids: [] }).studentIds).toBeNull();
    expect(mapQuizSummaryDto({ ...summary, student_ids: [7, "s2"] }).studentIds).toEqual(["7", "s2"]);
  });

  it("maps the audience list", () => {
    const audience = mapQuizAudienceDto({
      restricted: true,
      total: 2,
      assigned_count: 1,
      students: [
        { id: 1, name: "Ali", username: "ali", assigned: true, can_attend: true, attempted: true },
        { id: 2, name: "", username: "vali", assigned: false, can_attend: false, attempted: false },
      ],
    });
    expect(audience).toMatchObject({ restricted: true, total: 2, assignedCount: 1 });
    expect(audience.students[1]).toEqual({ id: "2", name: "vali", username: "vali", avatarUrl: null, assigned: false, attempted: false });
  });

  it("assigns course, due date and students in one request", async () => {
    expect(assignRequestBody({ courseId: "c1" })).toEqual({ course: "c1" });
    expect(assignRequestBody({ courseId: "c1", dueAt: "2026-11-20T23:59", studentIds: null })).toEqual({
      course: "c1",
      due_at: "2026-11-20T23:59",
      student_ids: [],
    });
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ ...summary, course: "c1", questions: [], groups: [] });
    await quizApi.assignToCourse({ quizId: "q1", courseId: "c1", studentIds: ["s1"] });
    expect(patch).toHaveBeenCalledWith("/api/v1/quizzes/q1/", { course: "c1", student_ids: ["s1"] });
  });

  it("replaces the audience with PUT", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ restricted: false, students: [] });
    await quizApi.setAudience("q1", []);
    expect(put).toHaveBeenCalledWith("/api/v1/quizzes/q1/audience/", { student_ids: [] });
  });
});

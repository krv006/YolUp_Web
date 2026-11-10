import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import type { HomeworkQuestion } from "@/shared/types";
import { homeworkApi } from "../api/homework.api";
import type { AssignmentDto, SubmissionDto } from "../api/homework.dto";
import { answerInputs } from "./homework-answers";
import { mapAssignmentDto, mapAssignmentRequest, mapSubmissionDto } from "./homework.mappers";

afterEach(() => vi.restoreAllMocks());

const questions: HomeworkQuestion[] = [
  { id: "q1", type: "single", text: "2+2?", options: ["3", "4"], correct: null, points: 1 },
  { id: "q2", type: "long", text: "Essay", options: [], correct: null, points: 5 },
  { id: "q3", type: "multiple", text: "Primes", options: ["2", "4", "5"], correct: null, points: 2 },
];

describe("homework questions", () => {
  it("sends only answered questions with trimmed text", () => {
    expect(answerInputs(questions, { q1: [1], q2: "  Mening fikrim  ", q3: [] })).toEqual([
      { questionId: "q1", answer: [1] },
      { questionId: "q2", answer: "Mening fikrim" },
    ]);
  });

  it("maps questions on the assignment and answers on the submission", () => {
    const assignment = mapAssignmentDto({
      id: "a1",
      course_id: "c1",
      course_title: "Algebra",
      subject: "math",
      title: "Test",
      due_at: null,
      created_at: "",
      has_questions: true,
      questions_points: 3,
      questions: [{ id: "q1", type: "single", text: "2+2?", options: ["3", "4"], points: 1 }],
    } as AssignmentDto);
    expect(assignment).toMatchObject({ hasQuestions: true, questionsPoints: 3 });
    expect(assignment.questions[0]).toMatchObject({ id: "q1", correct: null, points: 1 });

    const submission = mapSubmissionDto({
      id: "s1",
      assignment_id: "a1",
      student_id: "u1",
      student_name: "Ali",
      file_name: "",
      status: "done",
      overall_score: 50,
      grade: "",
      created_at: "",
      checked_at: null,
      answers: [{ question_id: "q1", type: "single", text: "2+2?", options: ["3", "4"], points: 1, answer: [0], score: 0, correct: [1], is_correct: false }],
    } as SubmissionDto);
    expect(submission?.answers[0]).toMatchObject({ questionId: "q1", isCorrect: false, correct: [1], score: 0, aiScore: null });
  });

  it("puts the questions into the create request as JSON", () => {
    const body = mapAssignmentRequest({
      courseId: "c1",
      title: "Test",
      questions: [{ type: "single", text: "2+2?", options: ["3", "4"], correct: [1], points: 1 }],
    });
    expect(JSON.parse(String(body.get("questions")))[0]).toMatchObject({ type: "single", correct: [1] });
    expect(mapAssignmentRequest({ courseId: "c1", title: "Test" }).has("questions")).toBe(false);
  });

  it("submits answers without a file and reviews per question", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ id: "s1", assignment_id: "a1", student_id: "u1", student_name: "", file_name: "", status: "done", overall_score: null, grade: "", created_at: "", checked_at: null });
    await homeworkApi.submit("a1", [], undefined, "", [{ questionId: "q1", answer: [1] }]);
    const body = post.mock.calls[0][1] as FormData;
    expect(body.has("file")).toBe(false);
    expect(JSON.parse(String(body.get("answers")))).toEqual([{ question_id: "q1", answer: [1] }]);

    await homeworkApi.review("s1", { answerScores: { q2: 4 } });
    expect(post.mock.calls[1][1]).toEqual({ answer_scores: { q2: 4 } });
  });
});

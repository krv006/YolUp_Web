import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { homeworkApi } from "../api/homework.api";
import type { AssignmentDto } from "../api/homework.dto";
import { assignFromBankBody, mapAssignmentAudienceDto, mapAssignmentDto, mapAssignmentRequest } from "./homework.mappers";

afterEach(() => vi.restoreAllMocks());

const base = { id: "a1", subject: "", title: "Uy ishi", due_at: null, created_at: "" };

describe("homework bank", () => {
  it("reads a bank assignment without a group", () => {
    const item = mapAssignmentDto({
      ...base,
      course_id: null,
      course_title: null,
      status: "bank",
      is_bank: true,
      copies_count: 3,
      questions_count: 4,
    } as AssignmentDto);
    expect(item).toMatchObject({ courseId: "", courseTitle: "", status: "bank", isBank: true, copiesCount: 3, questionsCount: 4 });
  });

  it("keeps the group's restriction on a given assignment", () => {
    const item = mapAssignmentDto({ ...base, course_id: "c1", course_title: "A", status: "active", student_ids: ["s1"] } as AssignmentDto);
    expect(item).toMatchObject({ isBank: false, status: "active", studentIds: ["s1"] });
    expect(mapAssignmentDto({ ...base, course_id: "c1", course_title: "A", student_ids: null } as AssignmentDto).studentIds).toBeNull();
  });

  it("saves to the bank by leaving the group empty", () => {
    expect(mapAssignmentRequest({ courseId: null, title: "Uy ishi" }).get("course_id")).toBe("");
  });

  it("sends groups, students and the deadline when giving from the bank", () => {
    expect(
      assignFromBankBody({ courseIds: ["c1"], studentIds: [], dueAt: "2026-11-20T23:59", allowLate: true, announceInChat: false })
    ).toEqual({ course_ids: ["c1"], student_ids: [], due_at: "2026-11-20T23:59", allow_late: true, announce_in_chat: false });
  });

  it("limits a single group copy to the chosen students", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ count: 1, assignments: [{ ...base, id: "a9", course_id: "c1", course_title: "A" }] });
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ restricted: true, students: [] });
    const created = await homeworkApi.assignFromBank("a1", {
      courseIds: ["c1"],
      studentIds: [],
      dueAt: null,
      allowLate: true,
      announceInChat: true,
    });
    expect(post).toHaveBeenCalledWith("/api/v1/homework/assignments/a1/assign/", {
      course_ids: ["c1"],
      student_ids: [],
      allow_late: true,
      announce_in_chat: true,
    });
    expect(created.map((item) => item.id)).toEqual(["a9"]);
    await homeworkApi.setAudience("a9", ["s1"]);
    expect(put).toHaveBeenCalledWith("/api/v1/homework/assignments/a9/audience/", { student_ids: ["s1"] });
  });

  it("reads who the assignment is given to", () => {
    const audience = mapAssignmentAudienceDto({
      restricted: true,
      total: 2,
      assigned_count: 1,
      students: [
        { id: "s1", name: "Bekzod", assigned: true, submitted: true },
        { id: "s2", name: "Jasur", assigned: false },
      ],
    });
    expect(audience.assignedCount).toBe(1);
    expect(audience.students[1]).toMatchObject({ id: "s2", assigned: false, submitted: false });
  });
});

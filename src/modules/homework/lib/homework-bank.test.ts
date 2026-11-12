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

  it("lists where a bank assignment was given, newest first as the backend sends it", () => {
    const item = mapAssignmentDto({
      ...base,
      course_id: null,
      status: "bank",
      is_bank: true,
      copies: [
        { id: 21, course_id: "c3", course_title: "8-B", due_at: "2026-11-22T23:59:00+05:00", status: "active", submissions_count: 1, student_ids: ["s7", 8], created_at: "2026-11-12T08:00:00Z" },
        { id: "a20", course_id: "c1", course_title: "7-A", due_at: null, status: "active", submissions_count: null, student_ids: null, created_at: "2026-11-11T08:00:00Z" },
      ],
    } as AssignmentDto);
    expect(item.copiesCount).toBe(2);
    expect(item.copies).toEqual([
      { id: "21", courseId: "c3", courseTitle: "8-B", dueAt: "2026-11-22T23:59:00+05:00", submissionsCount: 1, studentIds: ["s7", "8"], createdAt: "2026-11-12T08:00:00Z" },
      { id: "a20", courseId: "c1", courseTitle: "7-A", dueAt: null, submissionsCount: 0, studentIds: null, createdAt: "2026-11-11T08:00:00Z" },
    ]);
    expect(mapAssignmentDto({ ...base, course_id: "c1" } as AssignmentDto).copies).toEqual([]);
  });

  it("keeps the group's restriction on a given assignment", () => {
    const item = mapAssignmentDto({ ...base, course_id: "c1", course_title: "A", status: "active", student_ids: ["s1"] } as AssignmentDto);
    expect(item).toMatchObject({ isBank: false, status: "active", studentIds: ["s1"] });
    expect(mapAssignmentDto({ ...base, course_id: "c1", course_title: "A", student_ids: null } as AssignmentDto).studentIds).toBeNull();
  });

  it("saves to the bank by leaving the group empty", () => {
    expect(mapAssignmentRequest({ courseId: null, title: "Uy ishi" }).get("course_id")).toBe("");
  });

  it("sends each group with its chosen students when giving from the bank", () => {
    expect(
      assignFromBankBody({
        targets: [
          { courseId: "c1", studentIds: ["s1", "s2"] },
          { courseId: "c2", studentIds: null },
          { courseId: "c3", studentIds: [] },
        ],
        dueAt: "2026-11-20T23:59",
        allowLate: true,
        announceInChat: false,
      })
    ).toEqual({
      targets: [{ course_id: "c1", student_ids: ["s1", "s2"] }, { course_id: "c2" }, { course_id: "c3" }],
      due_at: "2026-11-20T23:59",
      allow_late: true,
      announce_in_chat: false,
    });
  });

  it("gives from the bank in one request without a follow-up audience call", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ count: 1, assignments: [{ ...base, id: "a9", course_id: "c1", course_title: "A" }] });
    const put = vi.spyOn(apiClient, "put");
    const created = await homeworkApi.assignFromBank("a1", {
      targets: [{ courseId: "c1", studentIds: ["s1"] }],
      dueAt: null,
      allowLate: true,
      announceInChat: true,
    });
    expect(post).toHaveBeenCalledWith("/api/v1/homework/assignments/a1/assign/", {
      targets: [{ course_id: "c1", student_ids: ["s1"] }],
      allow_late: true,
      announce_in_chat: true,
    });
    expect(put).not.toHaveBeenCalled();
    expect(created.map((item) => item.id)).toEqual(["a9"]);
  });

  it("changes who an assignment is given to", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ restricted: true, students: [] });
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

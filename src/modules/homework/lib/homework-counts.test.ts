import { describe, expect, it } from "vitest";
import type { AssignmentDto } from "../api/homework.dto";
import { mapAssignmentDto } from "./homework.mappers";

const base = { id: "a1", subject: "", title: "Uy ishi", due_at: null, created_at: "", course_id: "c1", course_title: "7-A" };

describe("assignment counts", () => {
  it("reads who submitted out of who got it from the list", () => {
    const item = mapAssignmentDto({
      ...base,
      students_count: 12,
      submitted_count: 5,
      pending_review_count: 2,
      graded_count: 3,
      submissions_count: 7,
    } as AssignmentDto);
    expect(item.stats).toEqual({ studentsCount: 12, submittedCount: 5, pendingReviewCount: 2, gradedCount: 3, averageScore: null });
  });

  it("keeps the older nested stats working", () => {
    const item = mapAssignmentDto({ ...base, stats: { students_count: 10, submitted_count: 4, avg_score: 81 } } as AssignmentDto);
    expect(item.stats).toEqual({ studentsCount: 10, submittedCount: 4, pendingReviewCount: null, gradedCount: null, averageScore: 81 });
    expect(mapAssignmentDto(base as AssignmentDto).stats).toBeNull();
  });
});

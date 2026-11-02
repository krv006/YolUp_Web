import { describe, expect, it } from "vitest";
import { mapHomeworkReportDto } from "./homework.mappers";

describe("mapHomeworkReportDto", () => {
  it("reads the backend report shape (subjects + overall)", () => {
    const report = mapHomeworkReportDto({
      subjects: [
        { course_id: "c1", course_title: "Ingliz tili A1", assignments_total: 4, assignments_submitted: 3, avg_score: 8.5 },
        { course_id: "c2", course_title: "Matematika", assignments_total: 2, assignments_submitted: 2, avg_score: null },
      ],
      overall: { assignments_total: 6, assignments_submitted: 5, avg_score: 8.5 },
    } as Parameters<typeof mapHomeworkReportDto>[0]);
    expect(report.courses.map((course) => [course.courseId, course.assignedCount, course.submittedCount])).toEqual([
      ["c1", 4, 3],
      ["c2", 2, 2],
    ]);
    expect(report.overall).toMatchObject({ assignedCount: 6, submittedCount: 5, averageScore: 8.5 });
  });
});

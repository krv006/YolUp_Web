import type { AiResult, Assignment, CourseHomeworkReport, GradingScale, HomeworkReport, HomeworkReportSummary, Submission } from "@/shared/types";
import type {
  AiResultDto,
  AssignmentDto,
  AssignmentFormInput,
  HomeworkBoardDto,
  HomeworkCourseReportDto,
  HomeworkReportDto,
  SubmissionDto,
} from "../api/homework.dto";

export function mapAiResultDto(dto: AiResultDto | null | undefined): AiResult | null {
  if (!dto) return null;
  return {
    overallScore: dto.overall_score ?? null,
    grade: dto.grade ?? "",
    questions: (dto.questions ?? []).map((item) => ({
      questionNumber: item.question_number,
      question: item.question,
      studentAnswer: item.student_answer,
      expectedSolution: item.expected_solution,
      analysis: item.analysis,
      mistakes: item.mistakes ?? [],
      errorCategories: item.error_categories ?? [],
      correctAnswer: item.correct_answer,
      suggestions: item.suggestions ?? [],
      difficulty: item.difficulty,
      score: item.score,
    })),
    summary: dto.summary
      ? {
          strengths: dto.summary.strengths ?? [],
          weaknesses: dto.summary.weaknesses ?? [],
          topicsToReview: dto.summary.topics_to_review ?? [],
          recommendations: dto.summary.recommendations ?? [],
        }
      : null,
  };
}

export function mapSubmissionDto(dto: SubmissionDto | null | undefined): Submission | null {
  if (!dto) return null;
  return {
    id: String(dto.id),
    assignmentId: String(dto.assignment_id),
    studentId: String(dto.student_id),
    studentName: dto.student_name,
    fileName: dto.file_name,
    status: dto.status,
    overallScore: dto.overall_score,
    grade: dto.grade,
    error: dto.error || "",
    isLate: Boolean(dto.is_late),
    createdAt: dto.created_at,
    checkedAt: dto.checked_at,
    result: mapAiResultDto(dto.result),
    rawResult: (dto.result as Record<string, unknown> | null | undefined) ?? null,
    gradeValue: dto.grade_value ?? null,
    shareWithParent: dto.share_with_parent !== false,
    resubmitComment: dto.resubmit_comment || "",
  };
}

export function mapBoardDto(dto: HomeworkBoardDto) {
  return {
    sheets: (dto.sheets ?? []).map((sheet) => sheet.strokes ?? []),
    width: Number(dto.size?.[0] ?? 1600),
    height: Number(dto.size?.[1] ?? 900),
  };
}

export function defaultMaxScore(grading: GradingScale): number {
  if (grading === "hundred") return 100;
  if (grading === "none") return 0;
  return 5;
}

export function mapAssignmentDto(dto: AssignmentDto): Assignment {
  return {
    id: String(dto.id),
    courseId: String(dto.course_id),
    courseTitle: dto.course_title,
    subject: dto.subject_label || dto.subject,
    title: dto.title,
    description: dto.description || "",
    body: dto.body || "",
    attachmentName: dto.attachment_name || "",
    hasAttachment: Boolean(dto.has_attachment),
    dueAt: dto.due_at,
    skillKey: dto.skill_key || "",
    lessonId: dto.lesson_id == null ? null : String(dto.lesson_id),
    lessonTitle: dto.lesson_title || "",
    createdAt: dto.created_at,
    submissionsCount: dto.submissions_count ?? null,
    mySubmission: mapSubmissionDto(dto.my_submission),
    submissions: (dto.submissions ?? [])
      .map(mapSubmissionDto)
      .filter((item): item is Submission => item !== null),
    stats: dto.stats
      ? {
          studentsCount: dto.stats.students_count ?? null,
          submittedCount: dto.stats.submitted_count ?? null,
          averageScore: dto.stats.avg_score ?? null,
        }
      : null,
    status: dto.status === "draft" ? "draft" : "active",
    announceInChat: dto.announce_in_chat !== false,
    allowLate: dto.allow_late !== false,
    grading: dto.grading ?? "five",
    maxScore: dto.max_score ?? defaultMaxScore(dto.grading ?? "five"),
    aiGroupSummary: dto.ai_group_summary
      ? {
          text: dto.ai_group_summary.text ?? "",
          summary: dto.ai_group_summary.summary ?? "",
          topics: dto.ai_group_summary.topics ?? [],
          recommendations: dto.ai_group_summary.recommendations ?? [],
          submissionsCount: Number(dto.ai_group_summary.submissions_count ?? 0),
          createdAt: dto.ai_group_summary.created_at ?? null,
        }
      : null,
  };
}

function pickCount(...values: Array<number | null | undefined>): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function pickScore(...values: Array<number | null | undefined>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function summarize(assignedCount: number, submittedCount: number, averageScore: number | null): HomeworkReportSummary {
  return {
    assignedCount,
    submittedCount,
    submissionRate: assignedCount > 0 ? Math.round((submittedCount / assignedCount) * 100) : 0,
    averageScore,
  };
}

function mapCourseReportDto(dto: HomeworkCourseReportDto): CourseHomeworkReport {
  return {
    courseId: String(dto.course_id ?? dto.id ?? ""),
    courseTitle: dto.course_title ?? dto.title ?? dto.course_name ?? "",
    ...summarize(
      pickCount(dto.assigned_count, dto.assignments_count, dto.total_assignments),
      pickCount(dto.submitted_count, dto.submissions_count),
      pickScore(dto.avg_score, dto.average_score)
    ),
  };
}

export function mapHomeworkReportDto(dto: HomeworkReportDto | null | undefined): HomeworkReport {
  const rows: HomeworkCourseReportDto[] = Array.isArray(dto) ? dto : (dto?.courses ?? dto?.results ?? []);
  const courses = rows.map(mapCourseReportDto);

  const overallDto = !Array.isArray(dto) ? (dto?.overall ?? dto?.summary ?? dto?.total) : undefined;
  if (overallDto) return { courses, overall: mapCourseReportDto(overallDto) };

  const assignedCount = courses.reduce((sum, item) => sum + item.assignedCount, 0);
  const submittedCount = courses.reduce((sum, item) => sum + item.submittedCount, 0);
  const scored = courses.filter((item) => item.averageScore != null && item.submittedCount > 0);
  const weightTotal = scored.reduce((sum, item) => sum + item.submittedCount, 0);
  const averageScore =
    weightTotal > 0
      ? scored.reduce((sum, item) => sum + (item.averageScore as number) * item.submittedCount, 0) / weightTotal
      : null;

  return { courses, overall: summarize(assignedCount, submittedCount, averageScore) };
}

export function mapAssignmentRequest(form: AssignmentFormInput): FormData {
  const data = new FormData();
  data.set("course_id", String(form.courseId ?? ""));
  data.set("title", form.title);
  data.set("description", form.description || "");
  data.set("body", form.body || form.description || "");
  if (form.dueAt) data.set("due_at", form.dueAt);
  if (form.skillKey) data.set("skill_key", form.skillKey);
  if (form.lessonId) data.set("lesson_id", form.lessonId);
  if (form.extraInstructions) data.set("extra_instructions", form.extraInstructions);
  if (form.status) data.set("status", form.status);
  if (form.announceInChat !== undefined) data.set("announce_in_chat", String(form.announceInChat));
  if (form.allowLate !== undefined) data.set("allow_late", String(form.allowLate));
  if (form.grading) data.set("grading", form.grading);
  if (form.grading === "hundred" && form.maxScore) data.set("max_score", String(form.maxScore));
  if (form.file) data.set("attachment", form.file);
  return data;
}

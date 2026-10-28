import { apiClient, type RequestOptions } from "@/shared/api";
import type { StrokeDto } from "@/modules/board";
import type { Submission } from "@/shared/types";
import { homeworkEndpoints } from "./homework.endpoints";
import type {
  HomeworkBoardDto,
  AssignmentDto,
  AssignmentFormInput,
  HomeworkAiSummaryDto,
  HomeworkReportDto,
  SubmissionDto,
  SubmissionReviewInput,
} from "./homework.dto";
import {
  mapBoardDto,
  mapAssignmentDto,
  mapAssignmentRequest,
  mapHomeworkReportDto,
  mapSubmissionDto,
} from "../lib/homework.mappers";
import { validateHomeworkFile } from "../lib/homework-validation";

export const homeworkApi = {
  async getAssignments(courseId: string | null, options: RequestOptions = {}) {
    const items = await apiClient.get<AssignmentDto[]>(homeworkEndpoints.assignments, {
      ...options,
      query: { course: courseId },
    });
    return items.map(mapAssignmentDto);
  },
  async getAssignment(id: string, options?: RequestOptions) {
    return mapAssignmentDto(await apiClient.get<AssignmentDto>(homeworkEndpoints.assignment(id), options));
  },
  async createAssignment(form: AssignmentFormInput) {
    if (form.file) validateHomeworkFile(form.file, { assignment: true });
    return mapAssignmentDto(
      await apiClient.post<AssignmentDto>(homeworkEndpoints.assignments, mapAssignmentRequest(form))
    );
  },
  async updateAssignment(id: string, form: AssignmentFormInput) {
    if (form.file) validateHomeworkFile(form.file, { assignment: true });
    return mapAssignmentDto(
      await apiClient.patch<AssignmentDto>(homeworkEndpoints.assignment(id), mapAssignmentRequest(form))
    );
  },
  async deleteAssignment(id: string) {
    await apiClient.delete(homeworkEndpoints.assignment(id));
    return id;
  },
  async downloadAssignment(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(homeworkEndpoints.assignmentFile(id), { ...options, responseType: "blob" });
  },
  async submit(assignmentId: string, file: File | null, skillKey?: string, comment?: string): Promise<Submission | null> {
    validateHomeworkFile(file, { speaking: skillKey === "speaking" });
    const body = new FormData();
    body.set("file", file as File);
    if (comment?.trim()) body.set("comment", comment.trim());
    return mapSubmissionDto(
      await apiClient.post<SubmissionDto>(homeworkEndpoints.submit(assignmentId), body)
    );
  },
  /** Uy vazifasi doskasi (o'quvchining shaxsiy holati): sheetlar, o'lcham, fanga xos asboblar. */
  async getBoard(assignmentId: string, options?: RequestOptions) {
    return mapBoardDto(await apiClient.get<HomeworkBoardDto>(homeworkEndpoints.board(assignmentId), options));
  },
  async saveBoard(assignmentId: string, sheets: StrokeDto[][]) {
    return mapBoardDto(
      await apiClient.put<HomeworkBoardDto>(homeworkEndpoints.board(assignmentId), {
        sheets: sheets.map((strokes) => ({ strokes })),
      })
    );
  },
  async submitBoard(assignmentId: string): Promise<Submission | null> {
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.boardSubmit(assignmentId), {}));
  },
  async getSubmission(id: string, options?: RequestOptions) {
    return mapSubmissionDto(await apiClient.get<SubmissionDto>(homeworkEndpoints.submission(id), options));
  },
  async downloadSubmission(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(homeworkEndpoints.submissionFile(id), { ...options, responseType: "blob" });
  },
  async recheck(id: string) {
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.recheck(id), {}));
  },
  async review(id: string, input: SubmissionReviewInput) {
    const body: Record<string, unknown> = {};
    if (input.gradeValue !== undefined && input.gradeValue !== null) body.grade = input.gradeValue;
    else if (input.overallScore !== undefined) body.overall_score = input.overallScore;
    if (input.shareWithParent !== undefined) body.share_with_parent = input.shareWithParent;
    if (input.result !== undefined) body.result = input.result;
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.review(id), body));
  },
  async requestResubmit(id: string, comment: string) {
    await apiClient.post<{ ok?: boolean }>(homeworkEndpoints.requestResubmit(id), { comment });
    return id;
  },
  async remind(assignmentId: string, input?: { message?: string; notifyParents?: boolean }) {
    return apiClient.post<{ notified?: number; parents_notified?: number }>(
      homeworkEndpoints.remind(assignmentId),
      {
        ...(input?.message ? { message: input.message.slice(0, 500) } : {}),
        ...(input?.notifyParents ? { notify_parents: true } : {}),
      }
    );
  },
  async getAiStats(period: "today" | "week" | "month", options?: RequestOptions) {
    const dto = await apiClient.get<{
      period?: string;
      checked?: number | null;
      pending_confirm?: number | null;
    }>(homeworkEndpoints.aiStats, { ...options, query: { period } });
    return {
      period: dto.period ?? period,
      checked: dto.checked ?? 0,
      pendingConfirm: dto.pending_confirm ?? 0,
    };
  },
  async getAiSummary(assignmentId: string) {
    const dto = await apiClient.post<HomeworkAiSummaryDto>(
      homeworkEndpoints.aiSummary(assignmentId),
      {}
    );
    return {
      summary: dto.summary ?? "",
      topics: dto.topics ?? [],
      recommendations: dto.recommendations ?? [],
      submissionsCount: dto.submissions_count ?? 0,
      text: (dto as { text?: string | null }).text ?? "",
      createdAt: (dto as { created_at?: string | null }).created_at ?? null,
    };
  },
  async getReport(studentId?: string | null, options: RequestOptions = {}) {
    const dto = await apiClient.get<HomeworkReportDto>(homeworkEndpoints.report, {
      ...options,
      query: studentId ? { student_id: studentId } : undefined,
    });
    return mapHomeworkReportDto(dto);
  },
};

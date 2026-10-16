import { apiClient, type RequestOptions } from "@/shared/api";
import type { StrokeDto } from "@/modules/board";
import type { Submission } from "@/shared/types";
import { homeworkEndpoints } from "./homework.endpoints";
import type {
  HomeworkBoardDto,
  AssignmentDto,
  AssignmentFormInput,
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
  async submit(assignmentId: string, file: File | null, skillKey?: string): Promise<Submission | null> {
    validateHomeworkFile(file, { speaking: skillKey === "speaking" });
    const body = new FormData();
    body.set("file", file as File);
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
    if (input.overallScore !== undefined) body.overall_score = input.overallScore;
    if (input.grade !== undefined) body.grade = input.grade;
    if (input.result !== undefined) body.result = input.result;
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.review(id), body));
  },
  async getReport(studentId?: string | null, options: RequestOptions = {}) {
    const dto = await apiClient.get<HomeworkReportDto>(homeworkEndpoints.report, {
      ...options,
      query: studentId ? { student_id: studentId } : undefined,
    });
    return mapHomeworkReportDto(dto);
  },
};

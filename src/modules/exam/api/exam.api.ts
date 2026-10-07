import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import { mapAttemptAnswerRequest, type QuizAttemptAnswerInput } from "@/modules/quiz";
import { examEndpoints } from "./exam.endpoints";
import type {
  ExamCurrentDto,
  ExamDetailDto,
  ExamFormValues,
  ExamResultsDto,
  ExamStudentResultDetailDto,
  ExamStudentResultDto,
  ExamTemplateFormValues,
  ExamSummaryDto,
  ExamTemplateDto,
} from "./exam.dto";
import {
  mapExamCurrentDto,
  mapExamDetailDto,
  mapExamRequest,
  mapExamResultsDto,
  mapExamStudentResultDetailDto,
  mapExamStudentResultDto,
  mapExamTemplateRequest,
  mapExamSummaryDto,
  mapExamTemplateDto,
  toIsoDateTime,
} from "../lib/exam.mappers";
import { syncServerTime } from "../lib/server-time";

export const examApi = {
  async getTemplates(options?: RequestOptions) {
    const dto = await apiClient.get<unknown>(examEndpoints.templates, options);
    return normalizePagination<ExamTemplateDto>(dto).items.map(mapExamTemplateDto);
  },
  async getAll(courseId: string | null, options: RequestOptions = {}) {
    const dto = await apiClient.get<unknown>(examEndpoints.list, {
      ...options,
      query: courseId ? { course: courseId } : undefined,
    });
    const items = normalizePagination<ExamSummaryDto>(dto).items.map(mapExamSummaryDto);
    syncServerTime(items[0]?.serverNow);
    return items;
  },
  async getOne(id: string, options?: RequestOptions) {
    const exam = mapExamDetailDto(await apiClient.get<ExamDetailDto>(examEndpoints.detail(id), options));
    syncServerTime(exam.serverNow);
    return exam;
  },
  async create(form: ExamFormValues) {
    return mapExamDetailDto(await apiClient.post<ExamDetailDto>(examEndpoints.list, mapExamRequest(form)));
  },
  async update(id: string, values: { title?: string; startsAt?: string }) {
    const body: Record<string, unknown> = {};
    if (values.title !== undefined) body.title = values.title;
    if (values.startsAt !== undefined) body.starts_at = toIsoDateTime(values.startsAt);
    return mapExamDetailDto(await apiClient.patch<ExamDetailDto>(examEndpoints.detail(id), body));
  },
  async remove(id: string) {
    await apiClient.delete(examEndpoints.detail(id));
    return id;
  },
  async createTemplate(form: ExamTemplateFormValues) {
    return mapExamTemplateDto(
      await apiClient.post<ExamTemplateDto>(examEndpoints.templates, mapExamTemplateRequest(form))
    );
  },
  async removeTemplate(id: string) {
    await apiClient.delete(examEndpoints.template(id));
    return id;
  },
  async saveManualScores(id: string, studentId: string, scores: Record<string, number>) {
    return mapExamStudentResultDto(
      await apiClient.put<ExamStudentResultDto>(examEndpoints.manualScores(id, studentId), { scores })
    );
  },
  async getCurrent(id: string, options?: RequestOptions) {
    const current = mapExamCurrentDto(
      await apiClient.get<ExamCurrentDto>(examEndpoints.current(id), options)
    );
    syncServerTime(current.serverNow);
    return current;
  },
  async saveAnswers(id: string, answers: QuizAttemptAnswerInput[]) {
    const response = await apiClient.put<{ saved?: number; server_now?: string }>(
      examEndpoints.answers(id),
      { answers: answers.map(mapAttemptAnswerRequest) }
    );
    syncServerTime(response?.server_now);
    return response;
  },
  async getResults(id: string, options?: RequestOptions) {
    return mapExamResultsDto(await apiClient.get<ExamResultsDto>(examEndpoints.results(id), options));
  },
  async getStudentResult(id: string, studentId: string, options?: RequestOptions) {
    return mapExamStudentResultDetailDto(
      await apiClient.get<ExamStudentResultDetailDto>(examEndpoints.studentResult(id, studentId), options)
    );
  },
  async startAiReview(id: string, studentId: string) {
    return apiClient.post<{ status?: string }>(examEndpoints.aiReview(id, studentId), {});
  },
  async approveAiBand(id: string, studentId: string, band?: number) {
    return mapExamStudentResultDetailDto(
      await apiClient.post<ExamStudentResultDetailDto>(
        examEndpoints.aiApprove(id, studentId),
        band === undefined ? {} : { band }
      )
    );
  },
  async finish(id: string) {
    await apiClient.post(examEndpoints.finish(id), {});
    return id;
  },
};

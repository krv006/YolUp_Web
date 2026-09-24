import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import type { QuizDetail, QuizEditValues, QuizFormValues, QuizImportWarning } from "@/shared/types";
import { quizEndpoints } from "./quiz.endpoints";
import type { QuizAttemptAnswerInput } from "../lib/quiz.mappers";
import type {
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizDto,
  QuizImportPreviewDto,
  QuizImportRequest,
  QuizSummaryDto,
} from "./quiz.dto";
import {
  mapQuizAttemptRequest,
  mapQuizAttemptResultDto,
  mapQuizAttemptSummaryDto,
  mapQuizDto,
  mapImportWarningDtos,
  mapQuizEditRequest,
  mapQuizImportPreviewDto,
  mapQuizImportRequest,
  mapQuizRequest,
  mapQuizSummaryDto,
} from "../lib/quiz.mappers";

export interface ImportedQuiz {
  quiz: QuizDetail;
  warnings: QuizImportWarning[];
}

function mapImportedQuizDto(dto: QuizDto): ImportedQuiz {
  return { quiz: mapQuizDto(dto), warnings: mapImportWarningDtos(dto.warnings) };
}

export const quizApi = {
  async getAll(courseId: string | null, options: RequestOptions = {}) {
    const dto = await apiClient.get<unknown>(quizEndpoints.list, {
      ...options,
      query: { course: courseId, ordering: "-created_at", page_size: 200 },
    });
    return normalizePagination<QuizSummaryDto>(dto).items.map(mapQuizSummaryDto);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapQuizDto(await apiClient.get<QuizDto>(quizEndpoints.detail(id), options));
  },
  async create(form: QuizFormValues) {
    return mapQuizDto(await apiClient.post<QuizDto>(quizEndpoints.list, mapQuizRequest(form)));
  },
  async update(id: string, values: QuizEditValues) {
    return mapQuizDto(
      await apiClient.patch<QuizDto>(quizEndpoints.detail(id), mapQuizEditRequest(values))
    );
  },
  async importDocx(file: File, request: QuizImportRequest) {
    const body = new FormData();
    body.set("file", file);
    for (const [key, value] of Object.entries(mapQuizImportRequest(request))) body.set(key, value);
    return mapImportedQuizDto(await apiClient.post<QuizDto>(quizEndpoints.import, body));
  },
  async importDocxPreview(file: File) {
    const body = new FormData();
    body.set("file", file);
    return mapQuizImportPreviewDto(
      await apiClient.post<QuizImportPreviewDto>(quizEndpoints.import, body)
    );
  },
  async importGoogleLink(source: "google_doc" | "google_form", url: string, request: QuizImportRequest) {
    const endpoint = source === "google_doc" ? quizEndpoints.importGoogleDoc : quizEndpoints.importGoogleForm;
    return mapImportedQuizDto(
      await apiClient.post<QuizDto>(endpoint, { url, ...mapQuizImportRequest(request) })
    );
  },
  async publish(id: string) {
    return mapQuizDto(await apiClient.post<QuizDto>(quizEndpoints.publish(id), {}));
  },
  async downloadTemplate(type: "docx" | "xlsx", count: number) {
    return apiClient.get<Blob>(quizEndpoints.template, {
      responseType: "blob",
      query: { type, count },
    });
  },
  async remove(id: string) {
    await apiClient.delete(quizEndpoints.detail(id));
    return id;
  },
  async submitAttempt(
    quizId: string,
    answers: QuizAttemptAnswerInput[]
  ) {
    return mapQuizAttemptResultDto(
      await apiClient.post<QuizAttemptResultDto>(
        quizEndpoints.attempts(quizId),
        mapQuizAttemptRequest(answers)
      )
    );
  },
  async getAttempts(quizId: string, options?: RequestOptions) {
    const dto = await apiClient.get<unknown>(quizEndpoints.attempts(quizId), options);
    return normalizePagination<QuizAttemptSummaryDto>(dto).items.map(mapQuizAttemptSummaryDto);
  },
};

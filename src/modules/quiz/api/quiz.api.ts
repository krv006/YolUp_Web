import {
  API_ERROR_CODES,
  apiClient,
  AppError,
  directApiUrl,
  normalizePagination,
  type RequestOptions,
} from "@/shared/api";
import type { QuizDetail, QuizEditValues, QuizFormValues, QuizImportWarning } from "@/shared/types";
import { quizEndpoints } from "./quiz.endpoints";
import type { QuizAttemptAnswerInput } from "../lib/quiz.mappers";
import type {
  AiQuizJob,
  AiQuizJobDto,
  AiQuizRequest,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizQuestionStatDto,
  QuizDto,
  QuizGroupDto,
  QuizImportPreviewDto,
  QuizImportRequest,
  QuizSummaryDto,
} from "./quiz.dto";
import {
  mapQuizAttemptRequest,
  mapQuizAttemptResultDto,
  mapQuizQuestionStatDto,
  mapQuizDto,
  mapImportWarningDtos,
  mapQuizEditRequest,
  mapQuizGroupDto,
  mapQuizImportPreviewDto,
  mapQuizImportRequest,
  mapQuizRequest,
  mapQuizSummaryDto,
} from "../lib/quiz.mappers";

const AI_UPLOAD_TIMEOUT_MS = 300_000;

export type QuizExportType = "pdf" | "docx" | "xlsx";
export type QuizExportMode = "student" | "teacher";

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
  /** Guruhsiz testni (masalan, AI yaratgan) o'qituvchining guruhiga biriktiradi. */
  async assignToCourse(id: string, courseId: string) {
    return mapQuizDto(await apiClient.patch<QuizDto>(quizEndpoints.detail(id), { course: courseId }));
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
  async startAiGenerate(files: File[], request: AiQuizRequest) {
    const body = new FormData();
    for (const file of files) body.append("file", file);
    body.set("topic", request.topic);
    if (request.standard) body.set("standard", request.standard);
    if (request.rulesFile) body.set("rules_file", request.rulesFile);
    if (request.rulesText) body.set("rules_text", request.rulesText);
    if (request.materialText) body.set("material_text", request.materialText);
    if (request.examName) body.set("exam_name", request.examName);
    body.set("question_count", String(request.questionCount));
    if (request.courseId) body.set("course", request.courseId);
    if (request.subject) body.set("subject", request.subject);
    if (request.title) body.set("title", request.title);
    // Katta fayllar: (1) standart 15 soniyadan uzoq davom etadi; (2) Vercel proxy'si ularni uzib qo'yishi mumkin —
    // shuning uchun avval to'g'ridan-to'g'ri API domeniga yuboramiz, tarmoq darajasida muvaffaqiyatsiz bo'lsa
    // (CORS/ulanish) odatiy yo'l bilan qayta urinamiz.
    const options = { timeoutMs: AI_UPLOAD_TIMEOUT_MS };
    try {
      return await apiClient.post<AiQuizJobDto>(directApiUrl(quizEndpoints.aiGenerate), body, options);
    } catch (error) {
      if (error instanceof AppError && error.code === API_ERROR_CODES.NETWORK_ERROR) {
        return apiClient.post<AiQuizJobDto>(quizEndpoints.aiGenerate, body, options);
      }
      throw error;
    }
  },
  async getAiJobs(options?: RequestOptions): Promise<AiQuizJob[]> {
    const dto = await apiClient.get<unknown>(quizEndpoints.aiGenerate, options);
    return normalizePagination<AiQuizJobDto>(dto).items.map((item) => ({
      id: String(item.id),
      status: item.status,
      topic: item.topic ?? "",
      title: item.title ?? "",
      standard: item.standard ? item.standard : null,
      mode: item.mode ?? (item.standard ? "test_creator" : "simple"),
      summary: item.summary ?? "",
      questionCount: item.question_count ?? 0,
      quizId: item.quiz === null || item.quiz === undefined ? null : String(item.quiz),
      error: item.error ?? "",
      createdAt: item.created_at ?? "",
    }));
  },
  async publish(id: string) {
    return mapQuizDto(await apiClient.post<QuizDto>(quizEndpoints.publish(id), {}));
  },
  /** Testni fayl qilib yuklab olish: `student` — javobsiz, `teacher` — javob kaliti va Listening skripti bilan. */
  async exportQuiz(id: string, type: QuizExportType, mode: QuizExportMode) {
    return apiClient.get<Blob>(quizEndpoints.export(id), { responseType: "blob", query: { type, mode } });
  },
  async downloadTemplate(type: "docx" | "xlsx", count: number) {
    return apiClient.get<Blob>(quizEndpoints.template, {
      responseType: "blob",
      query: { type, count },
    });
  },
  async uploadGroupAudio(quizId: string, groupId: string, file: File) {
    const body = new FormData();
    body.set("file", file);
    return mapQuizGroupDto(
      await apiClient.post<QuizGroupDto>(quizEndpoints.groupAudio(quizId, groupId), body)
    );
  },
  async removeGroupAudio(quizId: string, groupId: string) {
    await apiClient.delete(quizEndpoints.groupAudio(quizId, groupId));
    return groupId;
  },
  async remove(id: string) {
    await apiClient.delete(quizEndpoints.detail(id));
    return id;
  },
  async submitAttempt(
    quizId: string,
    answers: QuizAttemptAnswerInput[],
    durationSeconds?: number | null
  ) {
    return mapQuizAttemptResultDto(
      await apiClient.post<QuizAttemptResultDto>(
        quizEndpoints.attempts(quizId),
        mapQuizAttemptRequest(answers, durationSeconds)
      )
    );
  },
  async getQuestionStats(quizId: string, options?: RequestOptions) {
    const dto = await apiClient.get<QuizQuestionStatDto[]>(quizEndpoints.stats(quizId), options);
    return (Array.isArray(dto) ? dto : []).map(mapQuizQuestionStatDto);
  },
  async startAiMiniQuiz(quizId: string, wrongQuestionIds: string[]) {
    return apiClient.post<{ id: string | number; status?: string }>(
      quizEndpoints.aiGenerateMini,
      { quiz_id: quizId, wrong_question_ids: wrongQuestionIds }
    );
  },
  async getAttempts(quizId: string, options?: RequestOptions) {
    const dto = await apiClient.get<unknown>(quizEndpoints.attempts(quizId), options);
    return normalizePagination<QuizAttemptSummaryDto & Partial<QuizAttemptResultDto>>(dto).items.map((item) =>
      mapQuizAttemptResultDto({
        ...item,
        answers: [...(item.answers ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      })
    );
  },
  async getDraft(quizId: string, options?: RequestOptions) {
    const dto = await apiClient.get<{ answers?: unknown[] | null; elapsed_seconds?: number | null; updated_at?: string | null }>(
      quizEndpoints.draft(quizId),
      options
    );
    return { answers: dto?.answers ?? [], elapsedSeconds: Number(dto?.elapsed_seconds ?? 0), updatedAt: dto?.updated_at ?? null };
  },
  async saveDraft(quizId: string, answers: unknown[], elapsedSeconds: number) {
    await apiClient.put(quizEndpoints.draft(quizId), { answers, elapsed_seconds: Math.max(0, Math.round(elapsedSeconds)) });
  },
  async deleteDraft(quizId: string) {
    await apiClient.delete(quizEndpoints.draft(quizId));
  },
  shareResults(quizId: string, parents: boolean) {
    return apiClient.post<{ ok?: boolean; message_id?: string | null; students?: number; parents_notified?: number }>(
      quizEndpoints.shareResults(quizId),
      { to: "group_chat", parents }
    );
  },
  async generateFromBank(input: { topic: string; count?: number; courseId?: string | null; title?: string }) {
    return mapQuizDto(
      await apiClient.post<QuizDto>(quizEndpoints.aiGenerateBank, {
        topic: input.topic,
        count: input.count,
        course: input.courseId || undefined,
        title: input.title || undefined,
      })
    );
  },

  exportAttempts(quizId: string, type: "xlsx" | "csv" = "xlsx") {
    return apiClient.get<Blob>(quizEndpoints.attemptsExport(quizId), {
      query: { type },
      responseType: "blob",
    });
  },

  async getNotAttempted(quizId: string, options?: RequestOptions) {
    const items = await apiClient.get<
      Array<{ id: string | number; name?: string; username?: string; avatar_url?: string | null }>
    >(quizEndpoints.notAttempted(quizId), options);
    return (items ?? []).map((item) => ({
      id: String(item.id),
      name: item.name ?? item.username ?? "",
      username: item.username ?? "",
      avatarUrl: item.avatar_url ?? null,
    }));
  },
};

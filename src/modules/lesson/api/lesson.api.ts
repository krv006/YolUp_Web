import { API_ERROR_CODES, apiClient, AppError, type RequestOptions } from "@/shared/api";
import type { Lesson } from "@/shared/types";
import { lessonEndpoints } from "./lesson.endpoints";
import type {
  LessonConflictsDto,
  LessonDto,
  LessonFormInput,
  LessonRatingDto,
  LessonRatingInput,
  LessonRecordingDto,
  LessonScheduleRequestDto,
  LessonScheduleResponseDto,
  LessonWaitingDto,
} from "./lesson.dto";
import {
  mapLessonDto,
  mapLessonPage,
  mapLessonRatingDto,
  mapLessonRatingList,
  mapLessonRatingRequest,
  mapLessonRecordingDto,
  mapLessonRequest,
} from "../lib/lesson.mappers";

function isMissingRatingApi(error: unknown): boolean {
  return (
    error instanceof AppError &&
    (error.status === 404 || error.code === API_ERROR_CODES.NOT_FOUND)
  );
}

/** Yozuv bo'lagining tartibi: sessiya id'si va shu sessiyadagi 0 dan boshlanuvchi raqam — server takror yuborilgan bo'lakni qayta yozmaydi. */
export interface RecordingChunkSequence {
  session: string;
  index: number;
}

function appendSequence(formData: FormData, sequence?: RecordingChunkSequence) {
  if (!sequence) return;
  formData.append("session", sequence.session);
  formData.append("index", String(sequence.index));
}

export const lessonApi = {
  async getAll(options: RequestOptions = {}) {
    return mapLessonPage(await apiClient.get(lessonEndpoints.list, options), options.query);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapLessonDto(await apiClient.get<LessonDto>(lessonEndpoints.detail(id), options));
  },
  async create(form: LessonFormInput) {
    return mapLessonDto(await apiClient.post<LessonDto>(lessonEndpoints.list, mapLessonRequest(form)));
  },
  async update(id: string, form: LessonFormInput, scope: "one" | "series" = "one") {
    return mapLessonDto(
      await apiClient.patch<LessonDto>(lessonEndpoints.detail(id), mapLessonRequest(form), {
        query: scope === "series" ? { scope } : undefined,
      })
    );
  },
  async cancel(id: string, scope: "one" | "series" = "one") {
    const dto = await apiClient.post<{ cancelled_count?: number }>(
      lessonEndpoints.cancel(id),
      {},
      { query: { scope } }
    );
    return dto.cancelled_count ?? 1;
  },
  async createSchedule(
    courseId: string,
    payload: LessonScheduleRequestDto
  ): Promise<{ count: number; lessons: Lesson[] } | null> {
    try {
      const dto = await apiClient.post<LessonScheduleResponseDto>(
        lessonEndpoints.schedule(courseId),
        payload
      );
      const lessons = (dto?.lessons ?? []).map(mapLessonDto);
      return { count: Number(dto?.count ?? lessons.length), lessons };
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    }
  },
  async createMany(dates: readonly string[], form: LessonFormInput) {
    const created: Lesson[] = [];
    const failed: Array<{ date: string; message: string }> = [];
    const CHUNK = 4;

    for (let index = 0; index < dates.length; index += CHUNK) {
      const chunk = dates.slice(index, index + CHUNK);
      const results = await Promise.allSettled(
        chunk.map((date) =>
          apiClient
            .post<LessonDto>(lessonEndpoints.list, mapLessonRequest({ ...form, date }))
            .then(mapLessonDto)
        )
      );
      results.forEach((result, offset) => {
        if (result.status === "fulfilled") created.push(result.value);
        else
          failed.push({
            date: chunk[offset],
            message: result.reason instanceof Error ? result.reason.message : "Xatolik",
          });
      });
    }

    return { created, failed };
  },
  async remove(id: string) {
    await apiClient.delete(lessonEndpoints.detail(id));
    return id;
  },
  async finish(id: string, recordingTitle?: string) {
    const title = recordingTitle?.trim();
    return mapLessonDto(
      await apiClient.post<LessonDto>(
        lessonEndpoints.finish(id),
        title ? { recording_title: title } : {}
      )
    );
  },
  async getRecording(id: string, options?: RequestOptions) {
    try {
      const dto = await apiClient.get<LessonRecordingDto>(lessonEndpoints.recording(id), options);
      return mapLessonRecordingDto(dto);
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      if (error instanceof AppError && error.code === API_ERROR_CODES.NOT_FOUND) return null;
      throw error;
    }
  },
  async getWaiting(id: string, options?: RequestOptions) {
    const dto = await apiClient.get<LessonWaitingDto>(lessonEndpoints.waiting(id), options);
    return {
      waitingCount: dto.waiting_count ?? null,
      totalCount: dto.total_count ?? null,
      students: (dto.students ?? []).map((item) => ({
        id: String(item.id),
        name: item.name ?? "",
        avatar: item.avatar ?? null,
      })),
    };
  },
  async shareRecording(id: string) {
    await apiClient.post(lessonEndpoints.shareRecording(id), {});
    return id;
  },
  async getConflicts(params: { start: string; duration: number; exclude?: string }, options?: RequestOptions) {
    const dto = await apiClient.get<LessonConflictsDto>(lessonEndpoints.conflicts, {
      ...options,
      query: {
        start: params.start,
        duration: params.duration,
        ...(params.exclude ? { exclude: params.exclude } : {}),
      },
    });
    return {
      hasConflict: Boolean(dto.has_conflict),
      lessons: (dto.lessons ?? []).map((item) => ({
        id: String(item.id),
        title: item.title ?? "",
        courseTitle: item.course_title ?? "",
        startsAt: item.starts_at ?? "",
        durationMinutes: Number(item.duration_min ?? 0),
      })),
    };
  },
  async removeRecording(id: string) {
    await apiClient.delete(lessonEndpoints.recording(id));
    return id;
  },
  async uploadRecordingAudio(id: string, chunk: Blob, startedAt?: string, sequence?: RecordingChunkSequence) {
    const formData = new FormData();
    formData.append("chunk", chunk, `lesson-${id}-${Date.now()}.webm`);
    if (startedAt) formData.append("started_at", startedAt);
    appendSequence(formData, sequence);
    await apiClient.post<void>(lessonEndpoints.recordingAudio(id), formData, {
      timeoutMs: 60_000,
    });
  },
  async finalizeRecordingAudio(id: string) {
    await apiClient.post<void>(lessonEndpoints.finalizeRecordingAudio(id));
  },
  async uploadRecordingVideo(id: string, chunk: Blob, startedAt?: string, sequence?: RecordingChunkSequence) {
    const formData = new FormData();
    formData.append("chunk", chunk, `lesson-${id}-${Date.now()}.webm`);
    if (startedAt) formData.append("started_at", startedAt);
    appendSequence(formData, sequence);
    await apiClient.post<void>(lessonEndpoints.recordingVideo(id), formData, {
      timeoutMs: 120_000,
    });
  },
  async finalizeRecordingVideo(id: string) {
    await apiClient.post<void>(lessonEndpoints.finalizeRecordingVideo(id));
  },
  async setReminder(id: string, minutes?: number) {
    return apiClient.post<{ has_reminder: boolean; minutes_before: number }>(
      lessonEndpoints.reminder(id),
      minutes ? { minutes_before: minutes } : {}
    );
  },
  async clearReminder(id: string) {
    await apiClient.delete(lessonEndpoints.reminder(id));
  },
  async rate(id: string, input: LessonRatingInput) {
    try {
      const dto = await apiClient.post<LessonRatingDto | null>(
        lessonEndpoints.rate(id),
        mapLessonRatingRequest(input)
      );
      return dto && typeof dto === "object" && "stars" in dto ? mapLessonRatingDto(dto) : null;
    } catch (error) {
      if (isMissingRatingApi(error)) {
        throw new AppError({
          code: API_ERROR_CODES.NOT_FOUND,
          status: 404,
          message: "Baholash serverda hali yoqilmagan.",
          originalError: error,
        });
      }
      throw error;
    }
  },
  async getRatings(id: string, options?: RequestOptions) {
    try {
      return mapLessonRatingList(await apiClient.get(lessonEndpoints.ratings(id), options));
    } catch (error) {
      if (isMissingRatingApi(error)) return null;
      throw error;
    }
  },
};

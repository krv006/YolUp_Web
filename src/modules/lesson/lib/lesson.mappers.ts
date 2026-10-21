import {
  normalizeMediaUrl,
  normalizePagination,
  type Page,
  type PaginationOptions,
} from "@/shared/api";
import type {
  Lesson,
  LessonRating,
  LessonRecording,
  LessonRecordingStatus,
} from "@/shared/types";
import type {
  LessonDto,
  LessonFormInput,
  LessonRateRequestDto,
  LessonRatingDto,
  LessonRatingInput,
  LessonRecordingDto,
  LessonRequestDto,
} from "../api/lesson.dto";

function toAverage(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapLessonDto(dto: LessonDto): Lesson {
  return {
    id: String(dto.id),
    courseId: String(dto.course),
    courseTitle: dto.course_title,
    title: dto.title ?? "",
    topic: dto.title ?? "",
    startsAt: dto.starts_at,
    durationMinutes: Number(dto.duration_min),
    duration: Number(dto.duration_min),
    status: dto.status,
    roomName: dto.room_name,
    createdAt: dto.created_at,
    date: dto.starts_at?.slice(0, 10) ?? "",
    time: dto.starts_at?.slice(11, 16) ?? "",
    note: dto.note ?? "",
    recurrenceId: dto.recurrence_id == null ? null : String(dto.recurrence_id),
    avgRating: toAverage(dto.avg_rating),
    ratingCount: Number(dto.rating_count ?? 0),
    quizId: dto.quiz_id ?? null,
  };
}

export function mapLessonPage(dto: unknown, options?: PaginationOptions): Page<Lesson> {
  const page = normalizePagination<LessonDto>(dto, options);
  return { ...page, items: page.items.map(mapLessonDto) };
}

const RECORDING_STATUSES: LessonRecordingStatus[] = ["recording", "merging", "completed", "failed"];

export function mapLessonRecordingDto(dto: LessonRecordingDto): LessonRecording {
  const status = RECORDING_STATUSES.includes(dto.status as LessonRecordingStatus)
    ? (dto.status as LessonRecordingStatus)
    : "recording";

  return {
    status,
    ready: Boolean(dto.ready && dto.stream_url),
    title: dto.title || "Dars yozuvi",
    streamUrl: normalizeMediaUrl(dto.stream_url),
    createdAt: dto.created_at ?? null,
    endedAt: dto.ended_at ?? null,
    error: dto.error ?? null,
    participantsCount: dto.participants_count ?? null,
    attendanceRate: dto.attendance_rate ?? null,
    boardPages: dto.board_pages ?? null,
  };
}

export function mapLessonRatingDto(dto: LessonRatingDto): LessonRating {
  const student = dto.student ?? null;
  const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(" ");

  return {
    id: String(dto.id),
    lessonId: dto.lesson === undefined || dto.lesson === null ? "" : String(dto.lesson),
    stars: Number(dto.stars ?? 0),
    description: dto.description?.trim() ?? "",
    studentId: student ? String(student.id) : null,
    studentName: fullName || student?.username || dto.student_name || "O‘quvchi",
    createdAt: dto.created_at,
  };
}

export function mapLessonRatingList(dto: unknown): LessonRating[] {
  return normalizePagination<LessonRatingDto>(dto).items.map(mapLessonRatingDto);
}

export function mapLessonRatingRequest(input: LessonRatingInput): LessonRateRequestDto {
  const description = input.description?.trim();
  return description ? { stars: input.stars, description } : { stars: input.stars };
}

export function mapLessonRequest(form: LessonFormInput): LessonRequestDto {
  const startsAt =
    form.startsAt ??
    `${form.date || new Date().toISOString().slice(0, 10)}T${form.time || "00:00"}:00`;
  return {
    course: form.courseId ?? null,
    title: form.topic ?? form.title ?? "",
    starts_at: startsAt,
    duration_min: Number(form.duration ?? form.durationMinutes ?? 45),
    ...(form.quizId === undefined ? {} : { quiz: form.quizId || null }),
    ...(form.note === undefined ? {} : { note: form.note }),
    ...(form.recurrence ? { recurrence: form.recurrence } : {}),
  };
}

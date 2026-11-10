import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import type { Material } from "@/shared/types";
import { materialEndpoints } from "./material.endpoints";
import type {
  LessonFolder,
  LessonFolderDto,
  MaterialCourseDto,
  MaterialCourseFolder,
  MaterialCourseLessons,
  MaterialDto,
  MaterialFilters,
  MaterialLessonsDto,
  MaterialUploadInput,
} from "./material.dto";

function mapMaterial(dto: MaterialDto): Material {
  return {
    id: String(dto.id),
    courseId: String(dto.course_id),
    courseTitle: dto.course_title ?? "",
    title: dto.title || dto.name || "",
    name: dto.name ?? "",
    size: dto.size ?? null,
    kind: dto.kind ?? "other",
    mimeType: dto.mime ?? "",
    uploadedBy: dto.uploaded_by ? { id: String(dto.uploaded_by.id), name: dto.uploaded_by.name ?? "" } : null,
    createdAt: dto.created_at ?? "",
    lessonId: dto.lesson_id === null || dto.lesson_id === undefined ? null : String(dto.lesson_id),
  };
}

const folderKind = (kind?: string): "group" | "club" => (kind === "club" ? "club" : "group");

export const materialApi = {
  async list(filters: MaterialFilters, options?: RequestOptions) {
    const page = normalizePagination<MaterialDto>(
      await apiClient.get(materialEndpoints.list, {
        ...options,
        query: {
          course: filters.course || undefined,
          lesson: filters.lesson || undefined,
          kind: filters.kind || undefined,
          search: filters.search?.trim() || undefined,
          page_size: 100,
        },
      })
    );
    return page.items.map(mapMaterial);
  },
  async upload(input: MaterialUploadInput) {
    const body = new FormData();
    body.set("course", input.course);
    body.set("file", input.file);
    if (input.lesson) body.set("lesson", input.lesson);
    if (input.title?.trim()) body.set("title", input.title.trim());
    return mapMaterial(await apiClient.post<MaterialDto>(materialEndpoints.list, body));
  },
  async remove(id: string) {
    await apiClient.delete(materialEndpoints.detail(id));
    return id;
  },
  async courses(options?: RequestOptions): Promise<MaterialCourseFolder[]> {
    const dto = await apiClient.get<MaterialCourseDto[]>(materialEndpoints.courses, options);
    return (Array.isArray(dto) ? dto : []).map((item) => ({
      id: String(item.id),
      title: item.title,
      kind: folderKind(item.kind),
      fileCount: Number(item.file_count ?? 0),
    }));
  },
  async courseLessons(courseId: string, options?: RequestOptions): Promise<MaterialCourseLessons> {
    const dto = await apiClient.get<MaterialLessonsDto>(materialEndpoints.courseLessons(courseId), options);
    return {
      course: { id: String(dto.course.id), title: dto.course.title, kind: folderKind(dto.course.kind) },
      generalCount: Number(dto.general?.file_count ?? 0),
      lessons: (dto.lessons ?? []).map((item) => ({
        id: String(item.id),
        title: item.title || dto.course.title,
        startsAt: item.starts_at,
        status: item.status ?? "",
        fileCount: Number(item.file_count ?? 0),
        hasRecording: Boolean(item.has_recording),
        hasBoard: Boolean(item.has_board),
      })),
    };
  },
  async lessonFolder(lessonId: string, options?: RequestOptions): Promise<LessonFolder> {
    const dto = await apiClient.get<LessonFolderDto>(materialEndpoints.lessonFolder(lessonId), options);
    return {
      lesson: { id: String(dto.lesson.id), title: dto.lesson.title ?? "", startsAt: dto.lesson.starts_at },
      files: (dto.files ?? []).map(mapMaterial),
      recordingStatus: dto.recording?.status ?? null,
      hasBoard: Boolean(dto.board),
    };
  },
  boardPdf(lessonId: string, options?: RequestOptions) {
    return apiClient.get<Blob>(materialEndpoints.boardPdf(lessonId), { ...options, responseType: "blob" });
  },
  download(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(materialEndpoints.file(id), { ...options, responseType: "blob" });
  },
};

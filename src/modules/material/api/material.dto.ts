import type { Material, MaterialKind } from "@/shared/types";

export interface MaterialDto {
  id: string | number;
  course_id: string | number;
  course_title?: string | null;
  title?: string | null;
  name?: string | null;
  size?: number | null;
  kind?: MaterialKind | null;
  mime?: string | null;
  url?: string | null;
  uploaded_by?: { id: string | number; name?: string | null } | null;
  created_at?: string | null;
  lesson_id?: string | number | null;
}

export interface MaterialCourseDto {
  id: string | number;
  title: string;
  kind?: "group" | "club";
  subject?: string | null;
  file_count?: number | null;
}

export interface MaterialLessonDto {
  id: string | number;
  title?: string | null;
  starts_at: string;
  status?: string | null;
  file_count?: number | null;
  has_recording?: boolean;
  has_board?: boolean;
}

export interface MaterialLessonsDto {
  course: { id: string | number; title: string; kind?: "group" | "club" };
  general?: { file_count?: number | null };
  lessons?: MaterialLessonDto[];
}

export interface LessonFolderDto {
  lesson: { id: string | number; title?: string | null; starts_at: string; status?: string | null };
  files?: MaterialDto[];
  recording?: { status: string; info_url?: string } | null;
  board?: { pdf_url: string } | null;
}

export interface MaterialCourseFolder {
  id: string;
  title: string;
  kind: "group" | "club";
  fileCount: number;
}

export interface MaterialLessonFolder {
  id: string;
  title: string;
  startsAt: string;
  status: string;
  fileCount: number;
  hasRecording: boolean;
  hasBoard: boolean;
}

export interface MaterialCourseLessons {
  course: { id: string; title: string; kind: "group" | "club" };
  generalCount: number;
  lessons: MaterialLessonFolder[];
}

export interface LessonFolder {
  lesson: { id: string; title: string; startsAt: string };
  files: Material[];
  recordingStatus: string | null;
  hasBoard: boolean;
}

export interface MaterialFilters {
  course?: string | null;
  lesson?: string | null;
  kind?: MaterialKind | null;
  search?: string;
}

export interface MaterialUploadInput {
  course: string;
  lesson?: string | null;
  file: File;
  title?: string;
}

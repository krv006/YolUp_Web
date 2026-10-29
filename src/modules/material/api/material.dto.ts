import type { MaterialKind } from "@/shared/types";

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
}

export interface MaterialFilters {
  course?: string | null;
  kind?: MaterialKind | null;
  search?: string;
}

export interface MaterialUploadInput {
  course: string;
  file: File;
  title?: string;
}

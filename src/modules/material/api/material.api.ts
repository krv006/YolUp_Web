import { apiClient, normalizePagination, type RequestOptions } from "@/shared/api";
import type { Material } from "@/shared/types";
import { materialEndpoints } from "./material.endpoints";
import type { MaterialDto, MaterialFilters, MaterialUploadInput } from "./material.dto";

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
  };
}

export const materialApi = {
  async list(filters: MaterialFilters, options?: RequestOptions) {
    const page = normalizePagination<MaterialDto>(
      await apiClient.get(materialEndpoints.list, {
        ...options,
        query: {
          course: filters.course || undefined,
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
    if (input.title?.trim()) body.set("title", input.title.trim());
    return mapMaterial(await apiClient.post<MaterialDto>(materialEndpoints.list, body));
  },
  async remove(id: string) {
    await apiClient.delete(materialEndpoints.detail(id));
    return id;
  },
  download(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(materialEndpoints.file(id), { ...options, responseType: "blob" });
  },
};

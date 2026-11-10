import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "../api/material.api";
import type { MaterialFilters } from "../api/material.dto";

export const materialKeys = Object.freeze({
  all: ["materials"] as const,
  list: (filters: MaterialFilters) =>
    ["materials", filters.course ?? "all", filters.lesson ?? "all", filters.kind ?? "all", filters.search?.trim() ?? ""] as const,
  courses: ["materials", "folders"] as const,
  courseLessons: (courseId: string) => ["materials", "folders", courseId] as const,
  lessonFolder: (lessonId: string) => ["materials", "lesson", lessonId] as const,
});

export function useMaterialCourses(enabled = true) {
  return useQuery({
    queryKey: materialKeys.courses,
    queryFn: ({ signal }) => materialApi.courses({ signal }),
    enabled,
    staleTime: 30_000,
  });
}

export function useMaterialLessons(courseId: string | null) {
  return useQuery({
    queryKey: materialKeys.courseLessons(courseId ?? ""),
    queryFn: ({ signal }) => materialApi.courseLessons(courseId as string, { signal }),
    enabled: Boolean(courseId),
    staleTime: 30_000,
  });
}

export function useLessonFolder(lessonId: string | null) {
  return useQuery({
    queryKey: materialKeys.lessonFolder(lessonId ?? ""),
    queryFn: ({ signal }) => materialApi.lessonFolder(lessonId as string, { signal }),
    enabled: Boolean(lessonId),
    staleTime: 15_000,
  });
}

export function useMaterials(filters: MaterialFilters, enabled = true) {
  return useQuery({
    queryKey: materialKeys.list(filters),
    queryFn: ({ signal }) => materialApi.list(filters, { signal }),
    enabled,
    staleTime: 30_000,
  });
}

export function useUploadMaterial() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: materialApi.upload,
    onSuccess: () => client.invalidateQueries({ queryKey: materialKeys.all }),
  });
}

export function useDeleteMaterial() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: materialApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: materialKeys.all }),
  });
}

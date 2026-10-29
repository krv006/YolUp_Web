import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "../api/material.api";
import type { MaterialFilters } from "../api/material.dto";

export const materialKeys = Object.freeze({
  all: ["materials"] as const,
  list: (filters: MaterialFilters) =>
    ["materials", filters.course ?? "all", filters.kind ?? "all", filters.search?.trim() ?? ""] as const,
});

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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { boardApi } from "../api/board.api";
import type { StrokeInput } from "../api/board.dto";

export const boardKeys = Object.freeze({
  all: ["board"] as const,
  state: (id: string) => ["board", id] as const,
  periodicTable: ["board", "periodic-table"] as const,
});

const FALLBACK_POLL_MS = 2000;

export function useBoard(lessonId: string, { enabled = true, live = false } = {}) {
  return useQuery({
    queryKey: boardKeys.state(lessonId),
    queryFn: ({ signal }) => boardApi.getState(lessonId, { signal }),
    enabled: Boolean(lessonId && enabled),
    refetchInterval: live ? false : FALLBACK_POLL_MS,
  });
}

export function usePeriodicTable(enabled = true) {
  return useQuery({
    queryKey: boardKeys.periodicTable,
    queryFn: ({ signal }) => boardApi.getPeriodicTable({ signal }),
    staleTime: Infinity,
    enabled,
  });
}

export function useAddStroke(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sheet, stroke }: { sheet: number; stroke: StrokeInput }) =>
      boardApi.addStroke(lessonId, sheet, stroke),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
  });
}

export function useAddStrokes(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ sheet, strokes }: { sheet: number; strokes: StrokeInput[] }) => {
      for (const stroke of strokes) {
        await boardApi.addStroke(lessonId, sheet, stroke);
      }
      return strokes.length;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddSheet(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => boardApi.addSheet(lessonId),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
  });
}

export function useEraseStrokes(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sheet, strokeIds, reason }: { sheet: number; strokeIds: string[]; reason: string }) =>
      boardApi.erase(lessonId, sheet, strokeIds, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useGrantDraw(lessonId: string) {
  return useMutation({ mutationFn: (studentId: string) => boardApi.grant(lessonId, studentId) });
}

export type BoardGrantInput = { studentIds: string[] } | { mode: "all" | "none" };

export function useSetBoardPermissions(lessonId: string) {
  return useMutation({
    mutationFn: (input: BoardGrantInput) =>
      "mode" in input
        ? boardApi.grantMode(lessonId, input.mode)
        : boardApi.grantMany(lessonId, input.studentIds),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeDraw(lessonId: string) {
  return useMutation({
    mutationFn: (studentId: string) => boardApi.revoke(lessonId, studentId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSendBoardToChat(lessonId: string) {
  return useMutation({
    mutationFn: () => boardApi.sendToChat(lessonId),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSolveFormula(lessonId: string) {
  return useMutation({ mutationFn: (expression: string) => boardApi.solve(lessonId, expression) });
}

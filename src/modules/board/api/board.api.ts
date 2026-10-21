import { apiClient, type RequestOptions } from "@/shared/api";
import { boardEndpoints } from "./board.endpoints";
import type {
  BoardStateDto,
  FormulaSolutionDto,
  PeriodicElementDto,
  StrokeInput,
} from "./board.dto";
import { mapBoardDto, mapPeriodicElementDto } from "../lib/board.mappers";

export const boardApi = {
  async getState(lessonId: string, options?: RequestOptions) {
    return mapBoardDto(await apiClient.get<BoardStateDto>(boardEndpoints.state(lessonId), options));
  },
  async getPeriodicTable(options?: RequestOptions) {
    const payload = await apiClient.get<PeriodicElementDto[]>(boardEndpoints.periodicTable, options);
    return (Array.isArray(payload) ? payload : []).map(mapPeriodicElementDto);
  },
  addStroke: (lessonId: string, sheet: number, stroke: StrokeInput) =>
    apiClient.post(boardEndpoints.stroke(lessonId), { sheet, stroke }),
  addSheet: (lessonId: string) => apiClient.post(boardEndpoints.sheet(lessonId), {}),
  erase: (lessonId: string, sheet: number, strokeIds: string[], reason: string) =>
    apiClient.post(boardEndpoints.erase(lessonId), { sheet, stroke_ids: strokeIds, reason }),
  grant: (lessonId: string, studentId: string) =>
    apiClient.post(boardEndpoints.grant(lessonId), { student_id: studentId }),
  grantMany: (lessonId: string, studentIds: string[]) =>
    apiClient.post<{ granted?: number; revoked?: number }>(boardEndpoints.grant(lessonId), {
      student_ids: studentIds,
    }),
  grantMode: (lessonId: string, mode: "all" | "none") =>
    apiClient.post<{ granted?: number; revoked?: number }>(boardEndpoints.grant(lessonId), { mode }),
  revoke: (lessonId: string, studentId: string) =>
    apiClient.post<{ ok?: boolean; revoked?: boolean }>(boardEndpoints.revoke(lessonId), {
      student_id: studentId,
    }),
  sendToChat: (lessonId: string) =>
    apiClient.post<{ message_id?: string }>(boardEndpoints.sendToChat(lessonId), {}),
  solve: (lessonId: string, expression: string) =>
    apiClient.post<FormulaSolutionDto>(boardEndpoints.solve(lessonId), { expr: expression }),
  downloadPdf: (lessonId: string, options?: RequestOptions) =>
    apiClient.get<Blob>(boardEndpoints.pdf(lessonId), { ...options, responseType: "blob" }),
};

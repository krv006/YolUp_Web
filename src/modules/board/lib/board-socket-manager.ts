import { RealtimeSocket, type SocketState } from "@/shared/api";
import type { StrokeDto, StrokeInput } from "../api/board.dto";

export type { SocketState };

export type BoardSocketEvent =
  | { type: "stroke"; sheet: number; stroke: StrokeDto }
  | { type: "erase"; sheet: number; strokeIds: string[]; by: string; reason: string }
  | { type: "sheet"; index: number; title?: string }
  | { type: "sheet_renamed"; index: number; title: string }
  | { type: "mic_request"; studentId: string; name: string }
  | { type: "mic_granted"; studentId: string }
  | { type: "mic_denied"; studentId: string }
  | { type: "mic_request_cancelled"; studentId: string }
  | { type: "camera_request_cancelled"; studentId: string }
  | { type: "current_sheet"; sheet: number }
  | { type: "camera_request"; studentId: string; name: string }
  | { type: "camera_granted"; studentId: string }
  | { type: "camera_denied"; studentId: string }
  | { type: "board_granted"; studentId: string }
  | { type: "board_revoked"; studentId: string }
  | { type: "error"; detail: string };

interface RawBoardEvent {
  type?: string;
  sheet?: number | string;
  stroke?: StrokeDto;
  stroke_ids?: string[];
  by?: string;
  reason?: string;
  index?: number | string;
  title?: string | null;
  student_id?: string | number;
  name?: string;
  detail?: string;
}

export function parseBoardEvent(raw: unknown): BoardSocketEvent | null {
  const event = (typeof raw === "string" ? JSON.parse(raw) : raw) as RawBoardEvent | null;
  if (!event) return null;

  switch (event.type) {
    case "stroke":
      return event.stroke
        ? { type: "stroke", sheet: Number(event.sheet ?? 0), stroke: event.stroke }
        : null;
    case "erase":
      return {
        type: "erase",
        sheet: Number(event.sheet ?? 0),
        strokeIds: event.stroke_ids ?? [],
        by: event.by ?? "",
        reason: event.reason ?? "",
      };
    case "sheet":
      return { type: "sheet", index: Number(event.index ?? 0), title: event.title ?? "" };
    case "sheet_renamed":
      return { type: "sheet_renamed", index: Number(event.index ?? 0), title: event.title ?? "" };
    case "mic_request":
      return event.student_id
        ? { type: "mic_request", studentId: String(event.student_id), name: event.name ?? "" }
        : null;
    case "mic_granted":
      return event.student_id ? { type: "mic_granted", studentId: String(event.student_id) } : null;
    case "mic_denied":
      return event.student_id ? { type: "mic_denied", studentId: String(event.student_id) } : null;
    case "camera_request":
      return event.student_id
        ? { type: "camera_request", studentId: String(event.student_id), name: event.name ?? "" }
        : null;
    case "mic_request_cancelled":
      return event.student_id ? { type: "mic_request_cancelled", studentId: String(event.student_id) } : null;
    case "camera_request_cancelled":
      return event.student_id ? { type: "camera_request_cancelled", studentId: String(event.student_id) } : null;
    case "current_sheet":
      return { type: "current_sheet", sheet: Number(event.sheet ?? 0) };
    case "camera_granted":
      return event.student_id ? { type: "camera_granted", studentId: String(event.student_id) } : null;
    case "camera_denied":
      return event.student_id ? { type: "camera_denied", studentId: String(event.student_id) } : null;
    case "board_granted":
      return event.student_id ? { type: "board_granted", studentId: String(event.student_id) } : null;
    case "board_revoked":
      return event.student_id ? { type: "board_revoked", studentId: String(event.student_id) } : null;
    case "error":
      return { type: "error", detail: event.detail || "Doska ulanishida xatolik" };
    default:
      return null;
  }
}

export interface BoardSocketManagerInit {
  lessonId: string;
  onEvent?: (event: BoardSocketEvent) => void;
  onState?: (state: SocketState) => void;
}

export class BoardSocketManager {
  private readonly socket: RealtimeSocket;

  constructor({ lessonId, onEvent, onState }: BoardSocketManagerInit) {
    this.socket = new RealtimeSocket({
      path: `/ws/board/${encodeURIComponent(lessonId)}/`,
      onState,
      onMessage: (raw) => {
        try {
          const parsed = parseBoardEvent(raw);
          if (parsed) onEvent?.(parsed);
        } catch {
          onEvent?.({ type: "error", detail: "Doska javobi noto‘g‘ri" });
        }
      },
    });
  }

  get isOpen(): boolean {
    return this.socket.isOpen;
  }

  start(): void {
    this.socket.start();
  }

  stop(): void {
    this.socket.stop();
  }

  sendStroke(sheet: number, stroke: StrokeInput): boolean {
    return this.socket.send({ type: "stroke", sheet, stroke });
  }
}

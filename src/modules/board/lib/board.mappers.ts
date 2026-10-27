import type {
  BoardState,
  BoardStateDto,
  PeriodicElement,
  PeriodicElementDto,
} from "../api/board.dto";

export interface BoardSignalsDto {
  away_students?: Array<{ student_id: string | number; name: string }>;
  pending_mic_requests?: Array<{ student_id: string | number; name: string }>;
  pending_camera_requests?: Array<{ student_id: string | number; name: string }>;
}

export function mapSignalsDto(dto: BoardSignalsDto) {
  const person = (item: { student_id: string | number; name: string }) => ({
    id: String(item.student_id),
    name: item.name || "O‘quvchi",
  });
  return {
    awayStudents: (dto.away_students ?? []).map(person),
    pendingMicRequests: (dto.pending_mic_requests ?? []).map(person),
    pendingCameraRequests: (dto.pending_camera_requests ?? []).map(person),
  };
}

export function mapBoardDto(dto: BoardStateDto): BoardState {
  return {
    sheets: (dto.sheets ?? []).map((sheet) => ({
      index: Number(sheet.index),
      title: sheet.title ?? "",
      strokes: sheet.strokes ?? [],
    })),
    canDraw: Boolean(dto.can_draw),
    isTeacher: Boolean(dto.is_teacher),
    width: Number(dto.size?.[0] ?? 1200),
    height: Number(dto.size?.[1] ?? 800),
    subject: dto.subject || "",
    mathEnabled: Boolean(dto.math_enabled),
    chemistryEnabled: Boolean(dto.chemistry_enabled),
    permissionMode: dto.permission_mode ?? "teacher",
    awayStudents: (dto.away_students ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
    pendingMicRequests: (dto.pending_mic_requests ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
    pendingCameraRequests: (dto.pending_camera_requests ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
  };
}

function formatMass(value: PeriodicElementDto["mass"]): string {
  if (value == null || value === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return String(Math.round(parsed * 1000) / 1000);
}

export function mapPeriodicElementDto(dto: PeriodicElementDto): PeriodicElement {
  const valence = Array.isArray(dto.valence) ? dto.valence.join(", ") : dto.valence;
  return {
    z: Number(dto.z),
    symbol: dto.symbol,
    name: dto.name,
    mass: formatMass(dto.mass),
    shells: (dto.shells ?? []).map(Number).filter((count) => Number.isFinite(count) && count > 0),
    valence: valence == null ? "" : String(valence),
    category: dto.category || "unknown",
    period: dto.period == null ? null : Number(dto.period),
    group: dto.group == null ? null : Number(dto.group),
    appearance: dto.appearance || "",
  };
}

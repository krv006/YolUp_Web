import { normalizeMediaUrl, normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import type { AttendanceRow, DomainUser, FocusJournal } from "@/shared/types";
import type { AttendanceDto, FocusJournalDto } from "../api/attendance.dto";

const TONES = ["violet", "blue", "emerald", "amber", "rose"] as const;

function mapStudent(dto: AttendanceDto["student"] | undefined): DomainUser {
  const id = dto?.id ? String(dto.id) : "";
  return {
    id,
    username: dto?.username ?? "",
    name: [dto?.first_name, dto?.last_name].filter(Boolean).join(" ") || dto?.username || "O‘quvchi",
    firstName: dto?.first_name ?? "",
    lastName: dto?.last_name ?? "",
    role: dto?.role,
    avatarTone: TONES[Math.abs(id.charCodeAt(0) || 0) % TONES.length],
    avatarUrl: normalizeMediaUrl(dto?.avatar ?? null),
  };
}

function time(value: string | null | undefined): string {
  return value
    ? new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "—";
}

function mapFocusJournal(
  dto: FocusJournalDto | null | undefined,
  fallbackExits: number,
  alert: boolean
): FocusJournal {
  return {
    exits: Number(dto?.exits ?? fallbackExits ?? 0),
    awaySeconds: Number(dto?.away_seconds ?? 0),
    longestSeconds: Number(dto?.longest_seconds ?? 0),
    timeline: (dto?.timeline ?? []).map((item) => ({
      leftAt: item.left_at,
      returnedAt: item.returned_at,
      seconds: item.seconds == null ? null : Number(item.seconds),
    })),
    alert,
  };
}

export function mapAttendanceDto(dto: AttendanceDto): AttendanceRow {
  const student = mapStudent(dto.student);
  const minutes = dto.minutes == null ? null : Number(dto.minutes);

  return {
    id: String(dto.id),
    lessonId: String(dto.lesson),
    lesson: dto.lesson_title,
    studentId: student.id,
    student,
    child: student.name,
    joinedAt: dto.joined_at,
    leftAt: dto.left_at,
    entered: time(dto.joined_at),
    exited: time(dto.left_at),
    minutes,
    duration: minutes === null ? "Darsda" : `${minutes} daqiqa`,
    attentionTotal: Number(dto.attention_total ?? 0),
    attentionAnswered: Number(dto.attention_answered ?? 0),
    focus: mapFocusJournal(dto.focus, Number(dto.focus_exits ?? 0), Boolean(dto.focus_alert)),
    focusPercent: dto.focus_percent ?? null,
    status: dto.left_at ? "completed" : "active",
  };
}

export function mapAttendancePage(dto: unknown, options?: PaginationOptions): Page<AttendanceRow> {
  const page = normalizePagination<AttendanceDto>(dto, options);
  return { ...page, items: page.items.map(mapAttendanceDto) };
}

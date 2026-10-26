import { normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import type { AttendanceRow, DomainUser, FocusJournal } from "@/shared/types";
import type { AttendanceDto, FocusJournalDto } from "../api/attendance.dto";

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
      seconds: Number(item.seconds ?? 0),
    })),
    alert,
  };
}

export function mapAttendanceDto(dto: AttendanceDto): AttendanceRow {
  const studentName =
    [dto.student?.first_name, dto.student?.last_name].filter(Boolean).join(" ") ||
    dto.student?.username ||
    "O‘quvchi";

  return {
    id: String(dto.id),
    lessonId: String(dto.lesson),
    lesson: dto.lesson_title,
    studentId: String(dto.student?.id),
    student: dto.student as unknown as DomainUser,
    child: studentName,
    joinedAt: dto.joined_at,
    leftAt: dto.left_at,
    entered: time(dto.joined_at),
    exited: time(dto.left_at),
    minutes: Number(dto.minutes ?? 0),
    duration: `${Number(dto.minutes ?? 0)} daqiqa`,
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

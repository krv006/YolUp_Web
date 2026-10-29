import type { AttendanceRow, DomainUser } from "@/shared/types";

export const LATE_AFTER_MINUTES = 5;

export type RosterStatus = "inLesson" | "present" | "late" | "absent";

export interface RosterEntry {
  student: DomainUser;
  status: RosterStatus;
  lateMinutes: number;
  row: AttendanceRow | null;
}

const ORDER: Record<RosterStatus, number> = { inLesson: 0, present: 1, late: 2, absent: 3 };

export function buildLessonRoster(
  rows: AttendanceRow[],
  students: DomainUser[],
  startsAt: string,
  live: boolean
): RosterEntry[] {
  const start = Date.parse(startsAt);
  const byStudent = new Map<string, AttendanceRow>();
  for (const row of rows) {
    const current = byStudent.get(row.studentId);
    if (!current || (row.joinedAt ?? "") < (current.joinedAt ?? "")) byStudent.set(row.studentId, row);
  }

  const people = new Map(students.map((student) => [student.id, student]));
  for (const row of byStudent.values()) {
    if (!people.has(row.studentId)) people.set(row.studentId, row.student);
  }

  return [...people.values()]
    .map((student) => {
      const row = byStudent.get(student.id) ?? null;
      const lateMinutes =
        row?.joinedAt && Number.isFinite(start)
          ? Math.max(0, Math.floor((Date.parse(row.joinedAt) - start) / 60_000))
          : 0;
      const status: RosterStatus = !row
        ? "absent"
        : live && !row.leftAt
          ? "inLesson"
          : lateMinutes >= LATE_AFTER_MINUTES
            ? "late"
            : "present";
      return {
        student: { ...student, avatarUrl: student.avatarUrl || row?.student.avatarUrl || null },
        status,
        lateMinutes,
        row,
      };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.student.name.localeCompare(b.student.name));
}

export function averageFocus(rows: AttendanceRow[]): number | null {
  const values = rows.map((row) => row.focusPercent).filter((value): value is number => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

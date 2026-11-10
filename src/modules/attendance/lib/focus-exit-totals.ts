import type { AttendanceRow } from "@/shared/types";

export interface FocusExitTotals {
  byLesson: Map<string, number>;
  byStudent: Map<string, number>;
}

export function focusExitTotals(rows: AttendanceRow[], lessonIds?: ReadonlySet<string>): FocusExitTotals {
  const byLesson = new Map<string, number>();
  const byStudent = new Map<string, number>();
  for (const row of rows) {
    if (lessonIds && !lessonIds.has(row.lessonId)) continue;
    const exits = row.focus.exits;
    byLesson.set(row.lessonId, (byLesson.get(row.lessonId) ?? 0) + exits);
    byStudent.set(row.studentId, (byStudent.get(row.studentId) ?? 0) + exits);
  }
  return { byLesson, byStudent };
}

import type { AttendanceRow, Lesson } from "@/shared/types";

export function monthAttendanceRate(lessons: Lesson[], rows: AttendanceRow[], now: Date): number | null {
  const joined = new Set(rows.filter((row) => row.joinedAt).map((row) => row.lessonId));
  const finished = lessons.filter((lesson) => {
    const date = new Date(lesson.startsAt);
    return lesson.status === "finished" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  if (!finished.length) return null;
  const attended = finished.filter((lesson) => lesson.attended ?? joined.has(lesson.id)).length;
  return Math.round((attended / finished.length) * 100);
}

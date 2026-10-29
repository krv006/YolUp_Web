import type { Lesson } from "@/shared/types";

export function monthAttendanceRate(lessons: Lesson[], now: Date): number | null {
  const finished = lessons.filter((lesson) => {
    const date = new Date(lesson.startsAt);
    return lesson.status === "finished" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  if (!finished.length) return null;
  const attended = finished.filter((lesson) => lesson.attended === true).length;
  return Math.round((attended / finished.length) * 100);
}

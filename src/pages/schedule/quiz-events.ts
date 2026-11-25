import type { ScheduleQuizItem } from "@/modules/lesson";
import type { Lesson } from "@/shared/types";

const PREFIX = "quiz:";
const BLOCK_MINUTES = 30;

export function isQuizEvent(lesson: Pick<Lesson, "id">): boolean {
  return lesson.id.startsWith(PREFIX);
}

export function quizEventId(lesson: Pick<Lesson, "id">): string {
  return lesson.id.slice(PREFIX.length);
}

export function scheduleRange(anchor: Date): { from: string; to: string } {
  const day = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  last.setDate(last.getDate() + ((7 - last.getDay()) % 7));
  return { from: day(first), to: day(last) };
}

export function quizEvents(
  quizzes: readonly ScheduleQuizItem[],
  options: { courseTitle: (courseId: string) => string; label: (title: string) => string; now: Date }
): Lesson[] {
  return quizzes.map((quiz) => {
    const startsAt = quiz.startsAt;
    const overdue = Boolean(quiz.endsAt) && new Date(quiz.endsAt as string).getTime() < options.now.getTime();
    return {
      id: `${PREFIX}${quiz.id}`,
      courseId: quiz.courseId,
      courseTitle: quiz.courseTitle || options.courseTitle(quiz.courseId),
      title: options.label(quiz.title),
      topic: options.label(quiz.title),
      startsAt,
      durationMinutes: BLOCK_MINUTES,
      duration: BLOCK_MINUTES,
      status: overdue ? "finished" : "scheduled",
      roomName: "",
      createdAt: startsAt,
      date: startsAt.slice(0, 10),
      time: startsAt.slice(11, 16),
      avgRating: null,
      ratingCount: 0,
      quizId: quiz.id,
      note: "",
      recurrenceId: null,
      studentCount: null,
      participantsCount: null,
      attendanceRate: null,
      joinedCount: null,
      focusExits: null,
      myRating: null,
      attended: null,
      recordingActive: false,
      recordingStartedAt: null,
      attendanceOpensAt: null,
      hasReminder: false,
      reminderMinutes: null,
      assignment: null,
      recurrence: null,
    };
  });
}

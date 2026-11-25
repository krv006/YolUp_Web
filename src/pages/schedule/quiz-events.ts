import type { Lesson, QuizSummary } from "@/shared/types";

const PREFIX = "quiz:";
const BLOCK_MINUTES = 30;

export function isQuizEvent(lesson: Pick<Lesson, "id">): boolean {
  return lesson.id.startsWith(PREFIX);
}

export function quizEventId(lesson: Pick<Lesson, "id">): string {
  return lesson.id.slice(PREFIX.length);
}

export function quizEvents(
  quizzes: readonly QuizSummary[],
  options: { courseTitle: (courseId: string) => string; label: (title: string) => string; now: Date }
): Lesson[] {
  return quizzes.flatMap((quiz) => {
    const startsAt = quiz.opensAt || quiz.dueAt;
    if (!quiz.courseId || quiz.status === "draft" || !startsAt) return [];
    const title = quiz.title || quiz.topic;
    const overdue = Boolean(quiz.dueAt) && new Date(quiz.dueAt as string).getTime() < options.now.getTime();
    return [
      {
        id: `${PREFIX}${quiz.id}`,
        courseId: quiz.courseId,
        courseTitle: options.courseTitle(quiz.courseId),
        title: options.label(title),
        topic: options.label(title),
        startsAt,
        durationMinutes: BLOCK_MINUTES,
        duration: BLOCK_MINUTES,
        status: overdue ? "finished" : "scheduled",
        roomName: "",
        createdAt: quiz.createdAt,
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
      },
    ];
  });
}

import { useMemo, useState } from "react";
import { useMyAnalytics } from "@/modules/analytics";
import { useGroupImages } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useExams } from "@/modules/exam";
import { useQuizzes } from "@/modules/quiz";
import type { StudentAttemptSummary } from "@/shared/types";
import { useStudentAssignments } from "../lib/use-student-assignments";

export function useStudentWorkspace() {
  const [now] = useState(() => new Date());
  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const exams = useExams(null);
  const analytics = useMyAnalytics();
  const groupImages = useGroupImages("student");
  const groups = useMemo(
    () =>
      (courses.data ?? []).map((course) => ({
        ...course,
        avatarUrl: course.avatarUrl ?? groupImages.get(course.id) ?? null,
      })),
    [courses.data, groupImages]
  );
  const assignments = useStudentAssignments(groups);

  const attempts = useMemo<StudentAttemptSummary[]>(
    () => (analytics.data?.kind === "student" ? analytics.data.recentAttempts : []),
    [analytics.data]
  );
  const attemptByQuiz = useMemo(() => {
    const map = new Map<string, StudentAttemptSummary>();
    for (const item of [...attempts].sort((a, b) => a.takenAt.localeCompare(b.takenAt))) map.set(item.quizId, item);
    return map;
  }, [attempts]);
  const published = useMemo(() => (quizzes.data ?? []).filter((quiz) => quiz.status !== "draft"), [quizzes.data]);

  return {
    now,
    courses: groups,
    coursesLoading: courses.isLoading,
    quizzes: published,
    quizzesLoading: quizzes.isLoading,
    exams: exams.data ?? [],
    examsLoading: exams.isLoading,
    assignments: assignments.data,
    assignmentsLoading: assignments.isLoading || courses.isLoading,
    attempts,
    attemptByQuiz,
    attemptCount: analytics.data?.kind === "student" ? analytics.data.attemptCount : 0,
    avgPercentage: analytics.data?.kind === "student" ? analytics.data.avgPercentage : null,
    overview: analytics.data?.kind === "student" ? analytics.data.overview : null,
  };
}

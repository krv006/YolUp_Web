import { useMemo, useState } from "react";
import { useMyAnalytics } from "@/modules/analytics";
import { useConversations, useGroupImages } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { useNotificationInbox } from "@/modules/notification";
import { useQuizzes } from "@/modules/quiz";
import type { Assignment, Course, Lesson, QuizSummary } from "@/shared/types";
import { monthAttendanceRate } from "../lib/attendance-rate";
import { useStudentAssignments } from "../lib/use-student-assignments";

const DAY_MS = 86_400_000;
const GRADE_KINDS = ["rating", "grade", "result", "graded"];

export type StudentTask =
  | { kind: "assignment"; id: string; title: string; courseTitle: string; dueAt: string; item: Assignment }
  | { kind: "quiz"; id: string; title: string; courseTitle: string; dueAt: string | null; item: QuizSummary };

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function useStudentHome() {
  const [now] = useState(() => new Date());
  const lessons = useLessons({ page_size: 100 });
  const courses = useCourses();
  const conversations = useConversations("student");
  const groupImages = useGroupImages("student");
  const quizzes = useQuizzes(null);
  const inbox = useNotificationInbox({ page_size: 30 });
  const analytics = useMyAnalytics();
  const groups = useMemo(() => courses.data ?? [], [courses.data]);

  const { data: assignments } = useStudentAssignments(groups);

  const courseById = useMemo(
    () =>
      new Map<string, Course>(
        groups.map((course) => [course.id, { ...course, avatarUrl: course.avatarUrl ?? groupImages.get(course.id) ?? null }])
      ),
    [groups, groupImages]
  );
  const roomByCourse = useMemo(
    () =>
      new Map(
        (conversations.data ?? [])
          .filter((item) => item.courseId)
          .map((item) => [item.courseId as string, item.id])
      ),
    [conversations.data]
  );

  const active = useMemo(
    () =>
      (lessons.data ?? [])
        .filter((lesson) => lesson.status !== "cancelled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [lessons.data]
  );
  const todayLessons = active.filter((lesson) => sameDay(new Date(lesson.startsAt), now));
  const liveLesson = todayLessons.find((lesson) => lesson.status === "live") ?? null;
  const nextLesson =
    active.find((lesson) => lesson.status === "scheduled" && new Date(lesson.startsAt).getTime() > now.getTime()) ??
    null;
  const nextToday = nextLesson && sameDay(new Date(nextLesson.startsAt), now) ? nextLesson : null;
  const heroLesson: Lesson | null = liveLesson ?? nextToday ?? nextLesson;
  const finishedToday = todayLessons.filter((lesson) => lesson.status === "finished").length;

  const tasks = useMemo<StudentTask[]>(() => {
    const open: StudentTask[] = assignments
      .filter((item) => item.status !== "draft" && !item.mySubmission && item.dueAt)
      .map((item) => ({
        kind: "assignment",
        id: item.id,
        title: item.title,
        courseTitle: item.courseTitle || courseById.get(item.courseId)?.title || "",
        dueAt: item.dueAt as string,
        item,
      }));
    const tests: StudentTask[] = (quizzes.data ?? [])
      .filter((quiz) => quiz.status !== "draft" && (!quiz.dueAt || new Date(quiz.dueAt).getTime() > now.getTime()))
      .map((quiz) => ({
        kind: "quiz",
        id: quiz.id,
        title: quiz.title,
        courseTitle: courseById.get(quiz.courseId)?.title ?? "",
        dueAt: quiz.dueAt,
        item: quiz,
      }));
    return [...open.filter((task) => new Date(task.dueAt as string).getTime() > now.getTime()), ...tests].sort(
      (a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")
    );
  }, [assignments, quizzes.data, courseById, now]);

  const tomorrow = new Date(now.getTime() + DAY_MS);
  const dueToday = tasks.filter((task) => task.dueAt && sameDay(new Date(task.dueAt), now)).length;
  const dueTomorrow = tasks.filter((task) => task.dueAt && sameDay(new Date(task.dueAt), tomorrow)).length;

  const grades = assignments
    .map((item) => item.mySubmission)
    .filter((entry) => entry && entry.gradeValue !== null && now.getTime() - new Date(entry.checkedAt ?? entry.createdAt).getTime() < 30 * DAY_MS)
    .map((entry) => entry?.gradeValue as number);
  const avgGrade = grades.length ? grades.reduce((sum, value) => sum + value, 0) / grades.length : null;

  const overview = analytics.data?.kind === "student" ? analytics.data.overview : null;
  const attendanceRate = overview ? overview.attendanceRateMonth : monthAttendanceRate(active, now);

  const recentGrades = (inbox.data?.items ?? []).filter(
    (item) =>
      GRADE_KINDS.some((kind) => item.kind?.includes(kind)) ||
      item.link?.type === "submission" ||
      item.link?.type === "quiz"
  );

  return {
    now,
    loading: lessons.isLoading || courses.isLoading,
    todayLessons,
    liveLesson,
    heroLesson,
    finishedToday,
    tasks,
    dueToday,
    dueTomorrow,
    avgGrade,
    attendanceRate,
    recentGrades,
    courseById,
    roomByCourse,
  };
}

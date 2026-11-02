import { useEffect, useMemo, useState } from "react";
import { useAttendance } from "@/modules/attendance";
import { useAuth, useLoginHistory } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { useExams } from "@/modules/exam";
import { useHomeworkReport } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { parentHome, useParentHomework, useParentLinks, useSelectedChild } from "@/modules/parent";
import { useOnlineStatus } from "@/shared/model";

const TICK_MS = 60_000;

export type ParentHomeStatus = "loading" | "error" | "connect" | "pending" | "ready";

export function useParentHome() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [now, setNow] = useState(() => Date.now());
  const { children, childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const links = useParentLinks();
  const childId = selectedChildId;
  const enabled = Boolean(childId);

  const report = useHomeworkReport(childId, enabled);
  const finished = useLessons({ status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ status: "live", page_size: 20 }, enabled);
  const attendance = useAttendance({ student: childId ?? "", page_size: 100 }, enabled);
  const homework = useParentHomework(childId);
  const logins = useLoginHistory(childId, enabled);
  const exams = useExams(null, enabled);
  const courses = useCourses();

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => globalThis.clearInterval(timer);
  }, []);

  const liveNow = (live.data ?? []).length > 0;
  const refetchLive = live.refetch;
  const refetchAttendance = attendance.refetch;
  useEffect(() => {
    if (!liveNow) return undefined;
    const timer = globalThis.setInterval(() => {
      void refetchLive();
      void refetchAttendance();
    }, TICK_MS);
    return () => globalThis.clearInterval(timer);
  }, [liveNow, refetchLive, refetchAttendance]);

  const courseIds = useMemo(() => {
    if (report.data) return new Set(report.data.courses.map((course) => course.courseId));
    return children.length <= 1 ? null : undefined;
  }, [report.data, children.length]);

  const view = useMemo(() => {
    if (courseIds === undefined) return null;
    const lessons = parentHome.childLessons(
      [...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])],
      courseIds
    );
    const rows = attendance.data ?? [];
    const byLesson = parentHome.rowsByLesson(rows);
    const assignments = homework.data ?? [];
    const points = parentHome.gradedScores(assignments);
    const homeworkSummary = parentHome.homeworkSummary(assignments, now);
    return {
      hero: parentHome.heroState(lessons, byLesson, now),
      week: parentHome.weekSummary(lessons, byLesson, now),
      month: parentHome.monthAttendance(lessons, byLesson, now),
      minutes: parentHome.weekMinutes(rows, now),
      recent: parentHome.recentLessons(lessons, byLesson, now),
      todayCount: lessons.filter((lesson) => new Date(lesson.startsAt).toDateString() === new Date(now).toDateString()).length,
      homework: homeworkSummary,
      score: parentHome.scoreSummary(points, now),
      trend: parentHome.scoreTrend(points, now),
      attention: parentHome.attentionItems({
        dueSoon: homeworkSummary.dueSoon,
        logins: logins.data ?? [],
        exams: exams.data ?? [],
        courseIds,
        now,
      }),
    };
  }, [courseIds, finished.data, scheduled.data, live.data, attendance.data, homework.data, logins.data, exams.data, now]);

  const teachers = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.teacher])),
    [courses.data]
  );

  const approved = children.length > 0;
  const pendingLink = (links.data ?? []).filter((link) => link.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const coreFailed = (childrenQuery.isError && !childrenQuery.data) || (links.isError && !links.data);
  const status: ParentHomeStatus =
    childrenQuery.isLoading || links.isLoading
      ? "loading"
      : approved
        ? "ready"
        : coreFailed
          ? "error"
          : pendingLink
            ? "pending"
            : "connect";
  const failed =
    coreFailed ||
    [report, finished, scheduled, live, attendance, homework].some((query) => query.isError);
  const retry = () => {
    for (const query of [childrenQuery, links, report, finished, scheduled, live, attendance, homework, logins, exams]) {
      void query.refetch();
    }
  };
  const sectionsLoading =
    status === "ready" &&
    (!view || finished.isLoading || scheduled.isLoading || attendance.isLoading || report.isLoading);
  const lastUpdated = Math.max(
    finished.dataUpdatedAt,
    attendance.dataUpdatedAt,
    homework.dataUpdatedAt,
    childrenQuery.dataUpdatedAt
  );

  return {
    status,
    sectionsLoading,
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    user,
    child: selectedChild,
    pendingLink,
    online,
    failed,
    retry,
    lastUpdated,
    now,
    view,
    teachers,
    homeworkLoading: homework.isLoading,
    scoreLoading: homework.isLoading,
  };
}

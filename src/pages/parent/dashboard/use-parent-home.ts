import { useEffect, useMemo, useState } from "react";
import { useAttendance } from "@/modules/attendance";
import { useAuth, useLoginHistory } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import {
  isConsentRequired,
  parentHome,
  useChildExams,
  useChildSummary,
  useParentHomework,
  useParentLinks,
  useSelectedChild,
} from "@/modules/parent";
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

  const student = childId ?? "";
  const finished = useLessons({ student, status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ student, status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ student, status: "live", page_size: 20 }, enabled);
  const summary = useChildSummary(childId);
  const attendance = useAttendance({ student: childId ?? "", page_size: 100 }, enabled);
  const homework = useParentHomework(childId);
  const logins = useLoginHistory(childId, enabled);
  const exams = useChildExams(childId);
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

  const locked = isConsentRequired(summary.error) || isConsentRequired(attendance.error);

  const view = useMemo(() => {
    const lessons = parentHome.childLessons([...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])], null);
    const server = summary.data;
    const rows = attendance.data ?? [];
    const byLesson = parentHome.rowsByLesson(rows);
    const assignments = homework.data ?? [];
    const points = parentHome.gradedScores(assignments);
    const homeworkSummary = parentHome.homeworkSummary(assignments, now);
    return {
      hero: parentHome.heroState(lessons, byLesson, now),
      week: parentHome.weekSummary(lessons, byLesson, now),
      month: server
        ? {
            percent: server.attendance.month_percent,
            attended: server.attendance.attended,
            total: server.attendance.total,
            delta: server.attendance.delta_percent,
          }
        : parentHome.monthAttendance(lessons, byLesson, now),
      minutes: server ? server.week_minutes : parentHome.weekMinutes(rows, now),
      recent: parentHome.recentLessons(lessons, byLesson, now),
      todayCount: lessons.filter((lesson) => new Date(lesson.startsAt).toDateString() === new Date(now).toDateString()).length,
      homework: homeworkSummary,
      score: server ? { average: server.score.average, delta: server.score.delta } : parentHome.scoreSummary(points, now),
      trend: server ? server.score_trend.map((week) => week.average) : parentHome.scoreTrend(points, now),
      attention: parentHome.attentionItems({
        dueSoon: homeworkSummary.dueSoon,
        logins: logins.data ?? [],
        exams: exams.data ?? [],
        courseIds: null,
        now,
      }),
    };
  }, [finished.data, scheduled.data, live.data, attendance.data, homework.data, logins.data, exams.data, summary.data, now]);

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
    coreFailed || [finished, scheduled, live, homework].some((query) => query.isError) || (attendance.isError && !locked);
  const retry = () => {
    for (const query of [childrenQuery, links, finished, scheduled, live, attendance, homework, logins, exams, summary]) {
      void query.refetch();
    }
  };
  const sectionsLoading =
    status === "ready" &&
    (finished.isLoading || scheduled.isLoading || attendance.isLoading);
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
    locked,
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

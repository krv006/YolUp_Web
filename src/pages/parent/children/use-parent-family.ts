import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { attendanceApi, attendanceKeys } from "@/modules/attendance";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import {
  parentApi,
  parentFamily,
  parentHome,
  parentKeys,
  useParentLinks,
  useSelectedChild,
  type ChildPeriodSummary,
  type FamilyPeriod,
  type ParentChild,
} from "@/modules/parent";
import type { Lesson } from "@/shared/types";

export interface FamilyChild {
  child: ParentChild;
  loading: boolean;
  groups: number | null;
  attendance: number | null;
  attended: number;
  score: number | null;
  lastVisit: { course: string; at: string } | null;
  period: ChildPeriodSummary;
}

export function useParentFamily(period: FamilyPeriod) {
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChildId, selectChild } = useSelectedChild();
  const links = useParentLinks();
  const ids = children.map((child) => child.id);
  const enabled = ids.length > 0;

  const finished = useLessons({ status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ status: "live", page_size: 20 }, enabled);
  const reports = useQueries({
    queries: ids.map((id) => ({
      queryKey: homeworkKeys.report(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getReport(id, { signal }),
    })),
  });
  const attendance = useQueries({
    queries: ids.map((id) => {
      const params = { student: id, page_size: 100 };
      return {
        queryKey: attendanceKeys.list(params),
        queryFn: ({ signal }: { signal: AbortSignal }) => attendanceApi.getAll({ signal, query: params }),
      };
    }),
  });
  const homework = useQueries({
    queries: ids.map((id) => ({
      queryKey: parentKeys.homework(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => parentApi.getHomework(id, { signal }),
    })),
  });

  const allLessons: Lesson[] = [...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])];
  const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

  const rows: FamilyChild[] = children.map((child, index) => {
    const report = reports[index]?.data;
    const visits = attendance[index]?.data?.items ?? [];
    const assignments = homework[index]?.data ?? [];
    const courseIds = report ? new Set(report.courses.map((course) => course.courseId)) : children.length <= 1 ? null : new Set<string>();
    const lessons = parentHome.childLessons(allLessons, courseIds);
    const byLesson = parentHome.rowsByLesson(visits);
    const latest = parentFamily.latestVisit(visits);
    return {
      child,
      loading: Boolean(reports[index]?.isLoading || attendance[index]?.isLoading || homework[index]?.isLoading || finished.isLoading),
      groups: report ? report.courses.length : null,
      attendance: parentHome.monthAttendance(lessons, byLesson, now).percent,
      attended: parentFamily.attendedCount(visits),
      score: parentFamily.overallScore(assignments),
      lastVisit: latest?.joinedAt
        ? { course: lessonById.get(latest.lessonId)?.courseTitle || latest.lesson, at: latest.joinedAt }
        : null,
      period: parentFamily.childPeriodSummary({ lessons, rows: byLesson, assignments, now, period }),
    };
  });

  const pending = (links.data ?? [])
    .filter((link) => link.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const loading = childrenQuery.isLoading || links.isLoading;
  const failed =
    (childrenQuery.isError && !childrenQuery.data) ||
    (links.isError && !links.data) ||
    [finished, ...reports, ...attendance, ...homework].some((query) => query.isError);

  function retry() {
    for (const query of [childrenQuery, links, finished, scheduled, live, ...reports, ...attendance, ...homework]) {
      void query.refetch();
    }
  }

  return { now, loading, failed, retry, rows, pending, selectedChildId, selectChild };
}

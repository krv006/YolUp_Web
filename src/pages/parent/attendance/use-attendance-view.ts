import { useState } from "react";
import { useAttendance } from "@/modules/attendance";
import { useCourses } from "@/modules/course";
import { useHomeworkReport } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { parentAttendance, parentHome, useSelectedChild } from "@/modules/parent";
import type { Lesson } from "@/shared/types";

export function useAttendanceView() {
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const enabled = Boolean(selectedChildId);
  const report = useHomeworkReport(selectedChildId, enabled);
  const attendance = useAttendance({ student: selectedChildId ?? "", page_size: 100 }, enabled);
  const finished = useLessons({ status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ status: "live", page_size: 20 }, enabled);
  const courses = useCourses();

  const allLessons: Lesson[] = [...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])];
  const courseIds = report.data
    ? new Set(report.data.courses.map((course) => course.courseId))
    : children.length <= 1
      ? null
      : new Set<string>();
  const lessons = parentHome.childLessons(allLessons, courseIds);
  const entries = parentAttendance.attendanceEntries(lessons, parentHome.rowsByLesson(attendance.data ?? []));
  const teachers = new Map((courses.data ?? []).map((course) => [course.id, course.teacher]));
  const subjects = new Map(
    (courses.data ?? []).map((course) => [course.id, `${course.subject} ${course.subjectLabel} ${course.title}`])
  );
  const groups = (report.data?.courses ?? []).map((course) => ({ id: course.courseId, title: course.courseTitle }));

  const queries = [attendance, finished, report];
  function retry() {
    for (const query of [childrenQuery, attendance, finished, scheduled, live, report, courses]) void query.refetch();
  }

  return {
    now,
    child: selectedChild,
    entries,
    teachers,
    subjects,
    groups,
    loading: childrenQuery.isLoading || (enabled && queries.some((query) => query.isLoading)),
    failed: queries.some((query) => query.isError),
    error: attendance.error,
    retry,
  };
}

import { useState } from "react";
import { useAttendance } from "@/modules/attendance";
import { useLoginHistory } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { useHomeworkReport } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import {
  isConsentRequired,
  parentFamily,
  parentHome,
  useChildSummary,
  useSelectedChild,
  type CourseSchedule,
} from "@/modules/parent";
import type { Lesson } from "@/shared/types";

export interface ChildGroup {
  id: string;
  title: string;
  teacher: string;
  students: number | null;
  subject: string;
  language: boolean;
  schedule: CourseSchedule | null;
}

export function useChildProfile(childId: string) {
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChildId, selectChild } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  const enabled = Boolean(child);

  const report = useHomeworkReport(childId, enabled);
  const attendance = useAttendance({ student: childId, page_size: 100 }, enabled);
  const logins = useLoginHistory(childId, enabled);
  const summary = useChildSummary(enabled ? childId : null);
  const courses = useCourses();
  const finished = useLessons({ student: childId, status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ student: childId, status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ student: childId, status: "live", page_size: 20 }, enabled);

  const allLessons: Lesson[] = [...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])];
  const lessons = parentHome.childLessons(allLessons, null);
  const byLesson = parentHome.rowsByLesson(attendance.data ?? []);
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));

  const groups: ChildGroup[] = (report.data?.courses ?? []).map((item) => {
    const course = courseById.get(item.courseId);
    return {
      id: item.courseId,
      title: course?.title || item.courseTitle,
      teacher: course?.teacher ?? "",
      students: course ? course.studentCount : null,
      subject: `${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${item.courseTitle}`,
      language: course?.isLanguageSubject ?? false,
      schedule: parentFamily.courseSchedule(allLessons, item.courseId, now),
    };
  });

  const locked = isConsentRequired(summary.error) || isConsentRequired(attendance.error);
  const failed =
    [report, finished].some((query) => query.isError) ||
    (attendance.isError && !locked) ||
    (childrenQuery.isError && !childrenQuery.data);

  function retry() {
    for (const query of [childrenQuery, report, attendance, summary, finished, scheduled, live, logins, courses]) {
      void query.refetch();
    }
  }

  return {
    now,
    child,
    loading: childrenQuery.isLoading,
    sectionsLoading: report.isLoading || attendance.isLoading || finished.isLoading,
    failed,
    retry,
    selected: selectedChildId === childId,
    select: () => selectChild(childId),
    groups,
    locked,
    attendancePercent: locked
      ? null
      : (summary.data?.attendance.month_percent ?? parentHome.monthAttendance(lessons, byLesson, now).percent),
    recent: parentHome.recentLessons(lessons, byLesson, now),
    newDevices: parentFamily.newDeviceCount(logins.data ?? [], now),
  };
}

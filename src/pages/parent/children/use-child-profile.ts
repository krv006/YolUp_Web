import { useState } from "react";
import { useAttendance } from "@/modules/attendance";
import { useLoginHistory } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { useHomeworkReport } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import {
  parentFamily,
  parentHome,
  useParentConsents,
  useSelectedChild,
  type ConsentKind,
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
  const consents = useParentConsents();
  const courses = useCourses();
  const finished = useLessons({ status: "finished", ordering: "-starts_at", page_size: 100 }, enabled);
  const scheduled = useLessons({ status: "scheduled", ordering: "starts_at", page_size: 50 }, enabled);
  const live = useLessons({ status: "live", page_size: 20 }, enabled);

  const allLessons: Lesson[] = [...(finished.data ?? []), ...(scheduled.data ?? []), ...(live.data ?? [])];
  const courseIds = report.data
    ? new Set(report.data.courses.map((course) => course.courseId))
    : children.length <= 1
      ? null
      : new Set<string>();
  const lessons = parentHome.childLessons(allLessons, courseIds);
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

  const granted = new Set(
    (consents.data ?? [])
      .filter((consent) => consent.studentId === childId && consent.granted)
      .map((consent) => consent.kind)
  );

  const failed =
    [report, attendance, finished].some((query) => query.isError) || (childrenQuery.isError && !childrenQuery.data);

  function retry() {
    for (const query of [childrenQuery, report, attendance, finished, scheduled, live, logins, consents, courses]) {
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
    attendancePercent: parentHome.monthAttendance(lessons, byLesson, now).percent,
    recent: parentHome.recentLessons(lessons, byLesson, now),
    newDevices: parentFamily.newDeviceCount(logins.data ?? [], now),
    consentsLoading: consents.isLoading,
    isGranted: (kind: ConsentKind) => granted.has(kind),
  };
}

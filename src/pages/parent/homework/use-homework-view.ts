import { useState } from "react";
import { useCourses } from "@/modules/course";
import { useHomeworkReport } from "@/modules/homework";
import { useParentHomework, useSelectedChild } from "@/modules/parent";

export function useHomeworkView() {
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const enabled = Boolean(selectedChildId);
  const homework = useParentHomework(selectedChildId);
  const report = useHomeworkReport(selectedChildId, enabled);
  const courses = useCourses();

  const courseIds = report.data
    ? new Set(report.data.courses.map((course) => course.courseId))
    : children.length <= 1
      ? null
      : undefined;
  const assignments =
    courseIds === undefined
      ? []
      : (homework.data ?? []).filter((item) => item.status !== "draft" && (!courseIds || courseIds.has(item.courseId)));
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));

  function retry() {
    for (const query of [childrenQuery, homework, report, courses]) void query.refetch();
  }

  return {
    now,
    child: selectedChild,
    assignments,
    courseById,
    loading: childrenQuery.isLoading || (enabled && (homework.isLoading || (report.isLoading && children.length > 1))),
    failed: homework.isError,
    retry,
  };
}

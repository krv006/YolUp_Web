import { useState } from "react";
import { useCourses } from "@/modules/course";
import { useParentHomework, useSelectedChild } from "@/modules/parent";

export function useHomeworkView() {
  const [now] = useState(() => Date.now());
  const { childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const enabled = Boolean(selectedChildId);
  const homework = useParentHomework(selectedChildId);
  const courses = useCourses();

  const assignments = (homework.data ?? []).filter((item) => item.status !== "draft");
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));

  function retry() {
    for (const query of [childrenQuery, homework, courses]) void query.refetch();
  }

  return {
    now,
    child: selectedChild,
    assignments,
    courseById,
    loading: childrenQuery.isLoading || (enabled && homework.isLoading),
    failed: homework.isError,
    retry,
  };
}

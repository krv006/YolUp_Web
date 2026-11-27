import { useMemo } from "react";
import { useAllAssignments } from "@/modules/homework";
import type { Course } from "@/shared/types";

export function useStudentAssignments(courses: Course[]) {
  const all = useAllAssignments(courses.length > 0);
  const data = useMemo(() => (all.data ?? []).filter((item) => item.status !== "draft"), [all.data]);
  return { data, isLoading: all.isLoading };
}

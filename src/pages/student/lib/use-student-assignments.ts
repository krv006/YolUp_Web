import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import type { Course } from "@/shared/types";

export function useStudentAssignments(courses: Course[]) {
  const queries = useQueries({
    queries: courses.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const data = useMemo(
    () => queries.flatMap((query) => query.data ?? []).filter((item) => item.status !== "draft"),
    [queries]
  );
  return { data, isLoading: queries.some((query) => query.isLoading) };
}

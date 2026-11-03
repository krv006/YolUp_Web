import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { examApi, examKeys, useExamReminder } from "@/modules/exam";
import { parentResults, useChildExams, useSelectedChild } from "@/modules/parent";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";

export function useMockView() {
  const [now] = useState(() => Date.now());
  const { childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const exams = useChildExams(selectedChildId);
  const reminder = useExamReminder();

  const list = [...(exams.data ?? [])].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const finished = list.filter((exam) => exam.state === "finished");
  const results = useQueries({
    queries: finished.map((exam) => ({
      queryKey: examKeys.results(exam.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => examApi.getResults(exam.id, { signal }),
    })),
  });
  const byExam = new Map<string, ExamStudentResult | null>();
  const hidden = new Set<string>();
  const groupAverage = new Map<string, number | null>();
  finished.forEach((exam, index) => {
    const data = results[index]?.data;
    if (!data) return;
    if (data.hidden) hidden.add(exam.id);
    groupAverage.set(exam.id, data.groupAverage);
    byExam.set(exam.id, data.results.find((row) => row.studentId === selectedChildId) ?? null);
  });

  return {
    now,
    exams,
    loading: childrenQuery.isLoading || exams.isLoading,
    childrenLoading: childrenQuery.isLoading,
    child: selectedChild,
    childId: selectedChildId,
    list,
    byExam,
    hidden,
    groupAverage,
    resultsLoading: results.some((query) => query.isLoading),
    next: parentResults.nextExam(list, now),
    reminder,
    toggleReminder: (exam: ExamSummary) =>
      reminder.mutate({ id: exam.id, enabled: !exam.hasReminder }, { onSuccess: () => void exams.refetch() }),
  };
}

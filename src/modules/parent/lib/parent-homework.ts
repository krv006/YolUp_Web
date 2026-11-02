import type { Assignment } from "@/shared/types";
import { gradedScores } from "./parent-home";

const DAY_MS = 86_400_000;

export type HomeworkState = "pending" | "overdue" | "checking" | "error" | "resubmit" | "graded" | "done";
export type HomeworkFilter = "all" | "waiting" | "submitted" | "graded";

const WAITING: HomeworkState[] = ["pending", "overdue", "resubmit"];

export function homeworkState(assignment: Assignment, now: number): HomeworkState {
  const submission = assignment.mySubmission;
  if (!submission) {
    return assignment.dueAt && Date.parse(assignment.dueAt) < now ? "overdue" : "pending";
  }
  if (submission.status === "resubmit_requested") return "resubmit";
  if (submission.status === "error") return "error";
  if (submission.status === "done") return submission.gradeValue !== null ? "graded" : "done";
  return "checking";
}

export function isWaiting(state: HomeworkState): boolean {
  return WAITING.includes(state);
}

export function matchesFilter(state: HomeworkState, filter: HomeworkFilter): boolean {
  if (filter === "all") return true;
  if (filter === "waiting") return isWaiting(state);
  if (filter === "graded") return state === "graded";
  return !isWaiting(state);
}

export function splitHomework(assignments: Assignment[], filter: HomeworkFilter, now: number) {
  const visible = assignments.filter((item) => item.status !== "draft" && matchesFilter(homeworkState(item, now), filter));
  const waiting = visible
    .filter((item) => isWaiting(homeworkState(item, now)))
    .sort((a, b) => {
      const overdueA = homeworkState(a, now) === "overdue";
      const overdueB = homeworkState(b, now) === "overdue";
      if (overdueA !== overdueB) return overdueA ? 1 : -1;
      return (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
    });
  const submitted = visible
    .filter((item) => !isWaiting(homeworkState(item, now)))
    .sort((a, b) => (b.mySubmission?.createdAt ?? "").localeCompare(a.mySubmission?.createdAt ?? ""));
  return { waiting, submitted };
}

export function homeworkStats(assignments: Assignment[], now: number) {
  const states = assignments.filter((item) => item.status !== "draft").map((item) => homeworkState(item, now));
  const scores = gradedScores(assignments).map((point) => point.score);
  return {
    waiting: states.filter(isWaiting).length,
    checking: states.filter((state) => state === "checking" || state === "error").length,
    average: scores.length ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : null,
  };
}

export function countdown(dueAt: string, now: number): { days: number; hours: number; minutes: number } {
  const left = Math.max(0, Date.parse(dueAt) - now);
  return {
    days: Math.floor(left / DAY_MS),
    hours: Math.floor((left % DAY_MS) / 3_600_000),
    minutes: Math.floor((left % 3_600_000) / 60_000),
  };
}

export function daysBetween(from: number, to: number): number {
  return Math.max(0, Math.ceil((to - from) / DAY_MS));
}

export function scoreDelta(assignment: Assignment, assignments: Assignment[]): number | null {
  const current = gradedScores([assignment])[0];
  if (!current) return null;
  const previous = gradedScores(assignments.filter((item) => item.id !== assignment.id))
    .filter((point) => point.at < current.at)
    .sort((a, b) => b.at - a.at)[0];
  return previous ? Math.round((current.score - previous.score) * 10) / 10 : null;
}

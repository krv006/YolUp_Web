import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Assignment, QuizSummary } from "@/shared/types";
import { TaskCards, type TaskRow } from "./task-cards";

const DAY_MS = 86_400_000;

export interface MobileAssignmentListProps {
  assignments: Assignment[];
  quizzes: QuizSummary[];
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  onOpenAssignment: (assignment: Assignment) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignment: Assignment) => void;
  onOpenQuiz: (quiz: QuizSummary) => void;
  onEditQuiz: (quiz: QuizSummary) => void;
  highlightId?: string | null;
  className?: string;
}

function shortDate(value: string, months: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
}

function clock(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function MobileAssignmentList({
  assignments,
  quizzes,
  courseTitle,
  courseImage,
  courseTone,
  onOpenAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onOpenQuiz,
  onEditQuiz,
  highlightId = null,
  className = "flex flex-col gap-3",
}: MobileAssignmentListProps) {
  const { t } = useTranslation("group");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const [now] = useState(() => Date.now());

  function daysLeft(dueAt: string | null): number | null {
    if (!dueAt) return null;
    const due = new Date(dueAt).getTime();
    if (Number.isNaN(due)) return null;
    return Math.ceil((due - now) / DAY_MS);
  }

  const assignmentRows: TaskRow[] = assignments.map((item) => {
    const total = item.stats?.studentsCount ?? item.submissions.length;
    const submitted = item.stats?.submittedCount ?? item.submissionsCount ?? item.submissions.length;
    const pending = item.submissions.filter((entry) => !entry.grade).length;
    const left = daysLeft(item.dueAt);
    const draft = item.status === "draft";
    const closed = left !== null && left < 0;
    const done = total > 0 && submitted >= total;
    const skill = item.skillKey ? t(`dialogs.assignment.skillOptions.${item.skillKey}`) : "";

    const pill: TaskRow["pill"] = draft
      ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
      : (closed || done) && pending > 0
        ? { tone: "brand", icon: "quiz", label: t("mobileAssignments.review", { count: pending }) }
        : closed || done
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : left === null
            ? { tone: "teal", icon: "clock", label: t("mobileAssignments.noDue") }
            : { tone: "teal", icon: "clock", label: t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }) };

    return {
      id: item.id,
      assignmentId: item.id,
      title: item.title,
      meta: draft
        ? t("mobileAssignments.draftMeta")
        : [
            item.dueAt
              ? t("mobileAssignments.due", {
                  date: left !== null && left < 0 ? shortDate(item.dueAt, months) : `${shortDate(item.dueAt, months)}, ${clock(item.dueAt)}`,
                })
              : t("mobileAssignments.noDue"),
            skill,
          ]
            .filter(Boolean)
            .join(" · "),
      pill,
      aside: draft
        ? t("mobileAssignments.notSent")
        : pill.tone === "success" && item.stats?.averageScore != null
          ? t("mobileAssignments.average", { value: item.stats.averageScore.toFixed(1).replace(".", ",") })
          : t("mobileAssignments.submitted", { done: submitted, total }),
      progress: draft
        ? null
        : !total
          ? 0
          : pill.tone === "brand"
            ? Math.round(((submitted - pending) / total) * 100)
            : Math.min(100, Math.round((submitted / total) * 100)),
      onOpen: () => onOpenAssignment(item),
      menu: [
        { id: "open", label: t("mobileAssignments.open"), run: () => onOpenAssignment(item) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditAssignment(item) },
        { id: "delete", label: t("mobileAssignments.delete"), danger: true, run: () => onDeleteAssignment(item) },
      ],
    };
  });

  const quizRows: TaskRow[] = quizzes.map((quiz) => {
    const left = daysLeft(quiz.dueAt);
    const draft = quiz.status === "draft";
    const closed = left !== null && left < 0;
    return {
      id: `quiz-${quiz.id}`,
      quizId: quiz.id,
      title: quiz.title,
      meta: t("mobileAssignments.quizMeta", { count: quiz.questionCount }),
      pill: draft
        ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
        : closed
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : { tone: "teal", icon: "clock", label: left === null ? t("mobileAssignments.noDue") : t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }) },
      aside: draft ? t("mobileAssignments.notSent") : "",
      progress: draft ? null : closed ? 100 : 0,
      onOpen: () => onOpenQuiz(quiz),
      menu: [
        { id: "open", label: t("mobileAssignments.results"), run: () => onOpenQuiz(quiz) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditQuiz(quiz) },
      ],
    };
  });

  return (
    <TaskCards
      rows={[...assignmentRows, ...quizRows]}
      courseTitle={courseTitle}
      courseImage={courseImage}
      courseTone={courseTone}
      highlightId={highlightId}
      className={className}
    />
  );
}

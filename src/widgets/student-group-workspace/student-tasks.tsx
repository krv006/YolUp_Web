import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMyAnalytics } from "@/modules/analytics";
import { ROUTES } from "@/shared/config";
import type { Assignment, QuizSummary } from "@/shared/types";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";
import { PanelHeading, TaskCards, type TaskRow } from "@/widgets/group-workspace";
import { useAssignmentRows } from "./use-assignment-rows";

export interface StudentTasksProps {
  assignments: Assignment[];
  quizzes: QuizSummary[];
  loading: boolean;
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
}

export function StudentTasks({ assignments, quizzes, loading, courseTitle, courseImage, courseTone }: StudentTasksProps) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const analytics = useMyAnalytics();
  const assignmentRow = useAssignmentRows();

  const attempts = new Map(
    (analytics.data?.kind === "student" ? analytics.data.recentAttempts : []).map((item) => [item.quizId, item])
  );
  const day = (value: string) => {
    const date = new Date(value);
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  };
  const assignmentRows: TaskRow[] = assignments.filter((item) => item.status !== "draft").map(assignmentRow);

  const quizRows: TaskRow[] = quizzes
    .filter((quiz) => quiz.status !== "draft")
    .map((quiz) => {
      const attempt = attempts.get(quiz.id);
      const open = () => navigate(attempt ? ROUTES.student.testResults(quiz.id) : ROUTES.student.test(quiz.id));
      return {
        id: `quiz-${quiz.id}`,
        quizId: quiz.id,
        title: quiz.title,
        meta: [
          t("groupWorkspace.tasks.quizMeta", { count: quiz.questionCount }),
          attempt ? "" : quiz.dueAt ? t("groupWorkspace.tasks.due", { date: day(quiz.dueAt) }) : t("groupWorkspace.tasks.noDue"),
        ]
          .filter(Boolean)
          .join(" · "),
        pill: attempt
          ? { tone: "success", icon: "check-circle", label: t("groupWorkspace.tasks.finished") }
          : { tone: "violet", icon: "edit", label: t("groupWorkspace.tasks.new") },
        aside: attempt
          ? t("groupWorkspace.tasks.result", { value: `${Math.round(attempt.percentage ?? 0)}%` })
          : t("groupWorkspace.tasks.solve"),
        progress: null,
        onOpen: open,
        menu: [
          {
            id: "open",
            label: attempt ? t("groupWorkspace.tasks.results") : t("groupWorkspace.tasks.solve"),
            run: open,
          },
        ],
      };
    });

  const rows = [...assignmentRows, ...quizRows];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-transparent px-4 pt-5 pb-8 lg:gap-3.5 lg:px-7 lg:pt-3.5">
      <PanelHeading
        eyebrow={t("groupWorkspace.tasks.eyebrow")}
        title={t("groupWorkspace.tasks.title")}
        subtitle={t("groupWorkspace.tasks.subtitle")}
        className="shrink-0"
      />

      {loading && !rows.length ? (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3.5" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="flex h-28 flex-col gap-3 rounded-xl bg-surface p-4">
              <span className="flex items-center gap-3">
                <i className="size-11 shrink-0 rounded-md bg-skeleton" />
                <span className="flex flex-col gap-2">
                  <i className="h-3.5 w-40 rounded-full bg-skeleton" />
                  <i className="h-3 w-28 rounded-full bg-skeleton" />
                </span>
              </span>
              <i className="h-6 w-24 rounded-full bg-skeleton" />
            </span>
          ))}
        </div>
      ) : rows.length ? (
        <TaskCards
          rows={rows}
          courseTitle={courseTitle}
          courseImage={courseImage}
          courseTone={courseTone}
          className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3.5"
        />
      ) : (
        <MobileEmptyCard
          icon="assign"
          title={t("groupWorkspace.tasks.emptyTitle")}
          description={t("groupWorkspace.tasks.emptyHint")}
        />
      )}
    </div>
  );
}

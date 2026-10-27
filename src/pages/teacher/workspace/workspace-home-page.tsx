import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMyAnalytics } from "@/modules/analytics";
import { useCourses } from "@/modules/course";
import { useExams } from "@/modules/exam";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { useQuizzes } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { MobileWorkspaceHome } from "./mobile-workspace-home";

interface ModuleCard {
  id: string;
  icon: string;
  tone: string;
  to?: string;
}

const MODULES: ModuleCard[] = [
  { id: "tests", icon: "quiz", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.teacher.tests },
  {
    id: "assignments",
    icon: "assignment",
    tone: "bg-accent-saffron-bg text-accent-saffron-fg",
    to: ROUTES.teacher.homework,
  },
  {
    id: "mock",
    icon: "emoji-events",
    tone: "bg-accent-red-bg text-accent-red-fg",
    to: ROUTES.teacher.mockExams,
  },
  {
    id: "ai",
    icon: "auto-awesome",
    tone: "bg-accent-violet-bg text-accent-violet-fg",
    to: ROUTES.teacher.workspaceAi,
  },
  {
    id: "analytics",
    icon: "bar-chart",
    tone: "bg-accent-green-bg text-accent-green-fg",
    to: ROUTES.teacher.workspaceAnalytics,
  },
  { id: "materials", icon: "folder", tone: "bg-accent-blue-bg text-accent-blue-fg" },
];

export function WorkspaceHomePage() {
  const { t } = useTranslation("workspace");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const exams = useExams(null);
  const analytics = useMyAnalytics();

  const groups = useMemo(() => courses.data ?? [], [courses.data]);

  const assignmentQueries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        homeworkApi.getAssignments(course.id, { signal }),
    })),
  });

  const assignments = useMemo(
    () => assignmentQueries.flatMap((query) => query.data ?? []),
    [assignmentQueries]
  );

  const quizItems = quizzes.data ?? [];
  const drafts = quizItems.filter((quiz) => quiz.status === "draft").length;
  const examItems = exams.data ?? [];
  const runningExams = examItems.filter((exam) => exam.state === "running").length;
  const activeAssignments = assignments.filter((item) => item.status === "active").length;
  const pendingSubmissions = assignments.reduce((sum, item) => {
    const total = item.stats?.studentsCount ?? 0;
    const submitted = item.stats?.submittedCount ?? 0;
    return sum + Math.max(total - submitted, 0);
  }, 0);
  const stats = analytics.data?.kind === "teacher" ? analytics.data.overall : null;
  const rating = stats?.avgRating ?? null;

  if (isCompact) {
    const unchecked = assignments.reduce(
      (sum, item) => sum + item.submissions.filter((entry) => !entry.grade).length,
      0
    );
    return <MobileWorkspaceHome unchecked={unchecked} tests={quizItems.length} exams={examItems.length} />;
  }

  const counts: Record<string, string> = {
    tests: t("home.moduleCounts.tests", { count: quizItems.length }),
    assignments: t("home.moduleCounts.assignments", { count: activeAssignments }),
    mock: t("home.moduleCounts.mock", { count: runningExams }),
    ai: t("home.moduleCounts.ai", { count: 0 }),
    analytics: t("home.moduleCounts.analytics", {
      value: rating === null ? "—" : rating.toFixed(1).replace(".", ","),
    }),
    materials: t("home.moduleCounts.materials", { count: 0 }),
  };

  return (
    <WorkspaceShell
      eyebrow={t("home.eyebrow")}
      title={t("title")}
      action={
        <button
          type="button"
          className={workspaceAction}
          onClick={() => navigate(ROUTES.teacher.tests)}
        >
          {t("home.createTest")}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("home.stats.tests")}
          value={String(quizItems.length)}
          hint={t("home.stats.testsHint", { count: drafts })}
        />
        <StatCard
          label={t("home.stats.assignments")}
          value={String(activeAssignments)}
          tone="text-brand-strong"
          hint={t("home.stats.assignmentsHint", { count: pendingSubmissions })}
        />
        <StatCard
          label={t("home.stats.mock")}
          value={String(examItems.length)}
          hint={t("home.stats.mockHint", { count: runningExams })}
        />
        <StatCard
          label={t("home.stats.rating")}
          value={rating === null ? "—" : rating.toFixed(1).replace(".", ",")}
          tone="text-success-fg"
          hint={t("home.stats.ratingHint")}
        />
      </div>

      <strong className="text-title text-ink">{t("home.modules")}</strong>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            className="flex h-45 flex-col items-start gap-3 rounded-lg bg-surface p-6 text-left transition-colors hover:bg-subtle"
            onClick={() => (module.to ? navigate(module.to) : toast.info(t("soon")))}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-md ${module.tone}`}>
              <Icon name={module.icon} size={22} />
            </span>
            <strong className="text-title-lg text-ink">{t(`home.modules_list.${module.id}.title`)}</strong>
            <p className="min-w-0 flex-1 text-body-xs text-ink-secondary">
              {t(`home.modules_list.${module.id}.description`)}
            </p>
            <span className="flex w-full items-center gap-2">
              <small className="min-w-0 flex-1 truncate text-body-xs text-ink">
                {counts[module.id]}
              </small>
              <Icon name="arrow-forward" size={18} className="shrink-0 text-brand" />
            </span>
          </button>
        ))}
      </div>
    </WorkspaceShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
      <small className="truncate text-body-xs text-ink-tertiary">{hint}</small>
    </div>
  );
}

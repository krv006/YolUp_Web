import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMaterials } from "@/modules/material";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import {
  MobileListCard,
  MobileListRow,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
} from "@/shared/ui/mobile-page";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { sameDay, shortDateTime } from "../lib/format";
import { useStudentWorkspace } from "./use-student-workspace";

const DAY_MS = 86_400_000;

const MODULES = [
  { id: "tests", icon: "quiz", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.student.tests },
  { id: "assignments", icon: "assign", tone: "bg-accent-saffron-bg text-accent-saffron-fg", to: ROUTES.student.homework },
  { id: "mock", icon: "emoji-events", tone: "bg-accent-red-bg text-accent-red-fg", to: ROUTES.student.mockExams },
  { id: "ai", icon: "auto-awesome", tone: "bg-accent-violet-bg text-accent-violet-fg", to: ROUTES.student.ai },
  { id: "analytics", icon: "bar-chart", tone: "bg-accent-green-bg text-accent-green-fg", to: ROUTES.student.workspaceAnalytics },
  { id: "materials", icon: "folder", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.student.materials },
] as const;

export function StudentWorkspacePage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const data = useStudentWorkspace();
  const materials = useMaterials({});
  const { now } = data;

  const fresh = data.quizzes.filter((quiz) => !data.attemptByQuiz.has(quiz.id));
  const freshToday = fresh.filter((quiz) => quiz.dueAt && sameDay(new Date(quiz.dueAt), now)).length;
  const open = data.assignments.filter((item) => !item.mySubmission);
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const openTomorrow = open.filter((item) => item.dueAt && sameDay(new Date(item.dueAt), tomorrow)).length;
  const nextExam =
    data.exams.find((exam) => exam.state === "running") ??
    [...data.exams].filter((exam) => exam.state === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ??
    null;
  const examLabel = nextExam ? shortDateTime(nextExam.startsAt, months) : t("workspace.counts.mockNone");
  const average = data.avgPercentage === null ? "—" : `${Math.round(data.avgPercentage)}%`;
  const loading = data.quizzesLoading || data.assignmentsLoading;

  const counts: Record<(typeof MODULES)[number]["id"], string> = {
    tests: t("workspace.counts.tests", { count: fresh.length }),
    assignments: t("workspace.counts.assignments", { count: open.length }),
    mock: examLabel,
    ai: t("workspace.counts.ai"),
    analytics: t("workspace.counts.analytics", { value: average }),
    materials: t("workspace.counts.materials", { count: materials.data?.length ?? 0 }),
  };

  function openModule(module: (typeof MODULES)[number]) {
    navigate(module.to);
  }

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5.5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-32 font-body text-ink">
        <MobileTitleHeader eyebrow={t("workspace.mobile.eyebrow")} title={t("workspace:title")} />
        <MobileStatsCard
          label={t("workspace.mobile.overview")}
          actionLabel={t("workspace.mobile.details")}
          onAction={() => navigate(ROUTES.student.workspaceAnalytics)}
          items={[
            { id: "tests", value: loading ? "—" : fresh.length, label: t("workspace.mobile.stats.tests") },
            { id: "assignments", value: loading ? "—" : open.length, label: t("workspace.mobile.stats.assignments") },
            { id: "average", value: average, label: t("workspace.mobile.stats.average") },
          ]}
        />
        <section className="flex flex-col gap-3">
          <MobileSectionTitle>{t("workspace.modulesTitle")}</MobileSectionTitle>
          <MobileListCard>
            {MODULES.map((module) => (
              <MobileListRow
                key={module.id}
                icon={module.icon}
                tone={module.tone}
                title={t(`workspace.modules.${module.id}.title`)}
                subtitle={counts[module.id]}
                onClick={() => openModule(module)}
              />
            ))}
          </MobileListCard>
        </section>
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("workspace.eyebrow")} title={t("workspace:title")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("workspace.stats.tests")}
          value={loading ? "—" : String(fresh.length)}
          hint={t("workspace.stats.testsHint", { count: freshToday })}
        />
        <StatCard
          label={t("workspace.stats.assignments")}
          value={loading ? "—" : String(open.length)}
          tone="text-brand-strong"
          hint={t("workspace.stats.assignmentsHint", { count: openTomorrow })}
        />
        <StatCard
          label={t("workspace.stats.mock")}
          value={String(data.exams.filter((exam) => exam.state !== "finished").length)}
          hint={nextExam ? shortDateTime(nextExam.startsAt, months) : t("workspace.stats.mockNone")}
        />
        <StatCard
          label={t("workspace.stats.average")}
          value={average}
          tone="text-success-fg"
          hint={t("workspace.stats.averageHint", { count: data.attemptCount })}
        />
      </div>

      <strong className="text-title text-ink">{t("workspace.modulesTitle")}</strong>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <button
            key={module.id}
            type="button"
            className="flex min-h-45 flex-col items-start gap-3 rounded-lg bg-surface p-6 text-left transition-colors hover:bg-subtle"
            onClick={() => openModule(module)}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-md ${module.tone}`}>
              <Icon name={module.icon} size={22} />
            </span>
            <strong className="text-title-lg text-ink">{t(`workspace.modules.${module.id}.title`)}</strong>
            <p className="min-w-0 flex-1 text-body-xs text-ink-secondary">{t(`workspace.modules.${module.id}.description`)}</p>
            <span className="flex w-full items-center gap-2">
              <small className="min-w-0 flex-1 truncate text-body-xs font-semibold text-ink">{counts[module.id]}</small>
              <Icon name="arrow-forward" size={18} className="shrink-0 text-brand" />
            </span>
          </button>
        ))}
      </div>
    </WorkspaceShell>
  );
}

function StatCard({ label, value, hint, tone = "text-ink" }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
      <small className="truncate text-body-xs text-ink-tertiary">{hint}</small>
    </div>
  );
}

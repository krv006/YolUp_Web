import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourseStudents } from "@/modules/course";
import { quizDisplayTitle, useQuiz, useQuizAttempts } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";

interface Row {
  id: string;
  name: string;
  attempts: number;
  score: number | null;
  maxScore: number;
  percent: number | null;
}

function tone(percent: number | null): string {
  if (percent === null) return "bg-line";
  if (percent >= 85) return "bg-success";
  if (percent >= 70) return "bg-brand";
  return "bg-warning";
}

export function TestResultsPage() {
  const { t } = useTranslation("quiz");
  const { quizId = null } = useParams();
  const navigate = useNavigate();
  const quiz = useQuiz(quizId);
  const attempts = useQuizAttempts(quizId, Boolean(quizId));
  const students = useCourseStudents(quiz.data?.courseId ?? null, { page_size: 100 });

  const rows = useMemo<Row[]>(() => {
    const byStudent = new Map<string, Row>();

    for (const item of students.data?.items ?? []) {
      byStudent.set(item.student.id, {
        id: item.student.id,
        name: item.student.name,
        attempts: 0,
        score: null,
        maxScore: 0,
        percent: null,
      });
    }

    for (const attempt of attempts.data ?? []) {
      const current = byStudent.get(attempt.studentId) ?? {
        id: attempt.studentId,
        name: attempt.studentName,
        attempts: 0,
        score: null,
        maxScore: attempt.maxScore,
        percent: null,
      };
      const percent = attempt.maxScore
        ? Math.round((attempt.score / attempt.maxScore) * 100)
        : null;
      byStudent.set(attempt.studentId, {
        ...current,
        name: current.name || attempt.studentName,
        attempts: current.attempts + 1,
        score: current.score === null ? attempt.score : Math.max(current.score, attempt.score),
        maxScore: attempt.maxScore || current.maxScore,
        percent:
          current.percent === null ? percent : Math.max(current.percent, percent ?? 0),
      });
    }

    return [...byStudent.values()].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
  }, [attempts.data, students.data]);

  const solved = rows.filter((row) => row.attempts > 0);
  const average = solved.length
    ? Math.round(solved.reduce((sum, row) => sum + (row.percent ?? 0), 0) / solved.length)
    : null;
  const best = solved.length ? Math.max(...solved.map((row) => row.percent ?? 0)) : null;

  return (
    <WorkspaceShell
      eyebrow={t("results.eyebrow", {
        count: quiz.data?.questionCount ?? 0,
        subject: quiz.data?.subjectLabel ?? "",
      })}
      title={quiz.data ? quizDisplayTitle(quiz.data) : ""}
      action={
        <button
          type="button"
          className={workspaceAction}
          onClick={() => toast.info(t("tests.soon"))}
        >
          {t("results.share")}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("results.solved")}
          value={`${solved.length} / ${rows.length}`}
        />
        <StatCard
          label={t("results.average")}
          value={average === null ? "—" : `${average}%`}
        />
        <StatCard
          label={t("results.best")}
          value={best === null ? "—" : `${best}%`}
          tone="text-success-fg"
        />
        <StatCard label={t("results.averageTime")} value="—" hint={t("results.timeSoon")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_84px_72px_140px] items-center gap-3 bg-subtle px-5 py-3">
            {["student", "attempts", "correct", "time", "result"].map((column) => (
              <small key={column} className="truncate text-body-xs text-ink-secondary">
                {t(`results.columns.${column}`)}
              </small>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_72px_84px_72px_140px] items-center gap-3 border-b border-line-subtle px-5 py-3.5 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={row.name} size="sm" />
                <span className="min-w-0 truncate text-body text-ink">{row.name}</span>
              </span>
              <small className="text-body-sm text-ink-secondary">
                {row.attempts || "—"}
              </small>
              <small className="text-body-sm text-ink-secondary">
                {row.score === null ? "—" : `${row.score} / ${row.maxScore}`}
              </small>
              <small className="text-body-sm text-ink-secondary">—</small>
              <span className="flex items-center gap-2.5">
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-subtle">
                  <i
                    className={`block h-full rounded-full ${tone(row.percent)}`}
                    style={{ width: `${row.percent ?? 0}%` }}
                  />
                </span>
                {row.percent === null ? (
                  <small className="shrink-0 text-body-sm text-danger">
                    {t("results.notSolved")}
                  </small>
                ) : (
                  <small className="shrink-0 text-title-sm text-ink">{row.percent}%</small>
                )}
              </span>
            </div>
          ))}

          {!rows.length ? (
            <p className="px-5 py-10 text-center text-body-sm text-ink-tertiary">
              {t("results.empty")}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
            <strong className="text-title text-ink">{t("results.hardest")}</strong>
            <p className="text-body-xs text-ink-tertiary">{t("results.hardestSoon")}</p>
          </section>

          <section className="flex flex-col gap-3 rounded-lg bg-brand-subtle p-5">
            <strong className="flex items-center gap-2 text-title-sm text-brand-strong">
              <Icon name="auto-awesome" size={18} />
              {t("results.aiTitle")}
            </strong>
            <p className="text-body-xs text-ink-secondary">{t("results.aiHint")}</p>
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center rounded-full bg-surface text-button text-brand transition-colors hover:bg-tint"
              onClick={() => navigate(ROUTES.teacher.workspaceAi)}
            >
              {t("results.aiAction")}
            </button>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone: valueTone = "text-ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${valueTone}`}>{value}</strong>
      {hint ? <small className="truncate text-body-xs text-ink-tertiary">{hint}</small> : null}
    </div>
  );
}

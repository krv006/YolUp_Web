import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ExamScoreDialog,
  examApi,
  examKeys,
  useExam,
  useExamCurrent,
  useExamResults,
  useExamStudentResult,
  useRequestWritingAi,
  useSaveManualScores,
  useShareExamResults,
} from "@/modules/exam";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { ExamManualAnswer, ExamStudentResult } from "@/shared/types";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import {
  MobileMockLive,
  MobileMockResults,
  MobileWritingAi,
  MobileWritingList,
  type WritingEntry,
} from "./mobile-mock-results";

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

export function MockResultsPage() {
  const { t } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { examId = null } = useParams();
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const [params, setParams] = useSearchParams();
  const exam = useExam(examId);
  const results = useExamResults(examId, Boolean(examId));
  const running = exam.data?.state === "running";
  const current = useExamCurrent(isCompact && running ? examId : null, 15_000);
  const share = useShareExamResults();
  const saveScores = useSaveManualScores(examId ?? "");
  const requestAi = useRequestWritingAi(examId ?? "");
  const [picked, setPicked] = useState<string | null>(null);
  const [scoring, setScoring] = useState<{ studentId: string; prefill?: Record<string, number> } | null>(null);

  const rows = useMemo(() => results.data?.results ?? [], [results.data]);
  const sectionKeys = useMemo(() => {
    const keys = new Map<string, string>();
    for (const row of rows) {
      for (const section of row.sections) keys.set(section.key, section.title);
    }
    return [...keys.entries()];
  }, [rows]);

  const participated = rows.filter((row) => row.participated);
  const totals = participated
    .map((row) => row.total?.score ?? null)
    .filter((value): value is number => value !== null);
  const average = totals.length
    ? totals.reduce((sum, value) => sum + value, 0) / totals.length
    : null;
  const best = totals.length ? Math.max(...totals) : null;

  const sectionAverages = sectionKeys.map(([key, title]) => {
    const values = participated
      .map((row) => row.sections.find((section) => section.key === key)?.score ?? null)
      .filter((value): value is number => value !== null);
    return {
      key,
      title,
      value: values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null,
    };
  });

  const activeRow = rows.find((row) => row.studentId === picked) ?? null;
  const detail = useExamStudentResult(examId, activeRow?.studentId ?? null);

  const writing = activeRow?.sections.find((section) => section.manual) ?? null;

  const view = params.get("view");
  const writingKey = params.get("section") ?? "writing";
  const essayStudent = params.get("student");
  const participantIds = isCompact && view === "writing" ? rows.filter((row) => row.participated).map((row) => row.studentId) : [];
  const essays = useQueries({
    queries: participantIds.map((studentId) => ({
      queryKey: examKeys.studentResult(examId ?? "", studentId),
      queryFn: ({ signal }: { signal: AbortSignal }) => examApi.getStudentResult(examId as string, studentId, { signal }),
    })),
  });
  const essayDetail = useExamStudentResult(isCompact ? examId : null, isCompact ? essayStudent : null);
  const scoringResult = useExamStudentResult(isCompact ? examId : null, isCompact ? (scoring?.studentId ?? null) : null);
  const scoringRow = rows.find((row) => row.studentId === scoring?.studentId) ?? null;
  const scoringDetail = isCompact ? scoringResult.data : detail.data;
  const scoringKey = isCompact ? writingKey : (writing?.key ?? writingKey);
  const scoreSheet = (
    <ExamScoreDialog
      open={Boolean(scoringRow)}
      onOpenChange={(open) => !open && setScoring(null)}
      result={scoringRow}
      prefill={scoring?.prefill}
      suggested={
        scoringDetail?.writingAi?.suggestedBand != null ? { [scoringKey]: scoringDetail.writingAi.suggestedBand } : {}
      }
      pending={saveScores.isPending}
      onSave={(scores) =>
        scoringRow &&
        saveScores.mutate({ studentId: scoringRow.studentId, scores }, { onSuccess: () => setScoring(null) })
      }
    />
  );

  function shareResults() {
    if (!examId) return;
    share.mutate(examId, {
      onSuccess: (data) => toast.success(t("mock.mobile.shared", { count: data.students || participated.length })),
    });
  }

  if (isCompact) {
    const finishedDate = exam.data?.endsAt ? new Date(exam.data.endsAt) : null;
    const dateLabel =
      finishedDate && !Number.isNaN(finishedDate.getTime())
        ? `${finishedDate.getDate()}-${(months[finishedDate.getMonth()] ?? "").toLowerCase()}`
        : "";

    if (view === "writing" && essayStudent) {
      const row = rows.find((item) => item.studentId === essayStudent);
      return (
        <>
          <MobileWritingAi
            title={t("mock.mobile.aiTitle", {
              name: row?.studentName ?? "",
              section: row?.sections.find((section) => section.key === writingKey)?.title ?? "Writing",
            })}
            detail={essayDetail.data}
            requesting={requestAi.isPending}
            onBack={() => setParams({ view: "writing", section: writingKey })}
            onRequest={() => requestAi.mutate(essayStudent)}
            onApply={(value) => setScoring({ studentId: essayStudent, prefill: { [writingKey]: value } })}
          />
          {scoreSheet}
        </>
      );
    }

    if (view === "writing") {
      const entries: WritingEntry[] = rows
        .filter((row) => row.participated)
        .map((row) => ({
          row,
          detail: essays.find((query) => query.data?.studentId === row.studentId)?.data,
          sectionKey: writingKey,
        }));
      return (
        <MobileWritingList
          eyebrow={[exam.data?.title, dateLabel, t("mock.mobile.submissions", { count: entries.length })].filter(Boolean).join(" · ")}
          entries={entries}
          loading={essays.some((query) => query.isLoading)}
          onBack={() => setParams({})}
          onOpen={(entry) => setParams({ view: "writing", section: writingKey, student: entry.row.studentId })}
        />
      );
    }

    if (running) {
      const sectionList = (exam.data?.sections ?? []).filter((section) => section.kind === "section");
      const currentKey = current.data?.item?.key ?? null;
      const index = sectionList.findIndex((section) => section.key === currentKey);
      return (
        <MobileMockLive
          title={exam.data?.title ?? ""}
          sectionTitle={current.data?.item?.title ?? null}
          sectionIndex={index + 1}
          sectionCount={sectionList.length}
          endsAt={current.data?.endsAt ?? exam.data?.endsAt ?? null}
          rows={rows}
          onBack={() => navigate(ROUTES.teacher.mockExams)}
        />
      );
    }

    return (
      <>
        <MobileMockResults
          eyebrow={exam.data?.courseTitle ?? ""}
          title={exam.data?.title ?? ""}
          rows={rows}
          sections={sectionAverages.map((section) => ({
            ...section,
            manual: rows.some((row) => row.sections.some((item) => item.key === section.key && item.manual)),
          }))}
          loading={results.isLoading}
          sharing={share.isPending}
          onBack={() => navigate(ROUTES.teacher.mockExams)}
          onShare={shareResults}
          onSection={(key) => setParams({ view: "writing", section: key })}
          onStudent={(row) => setScoring({ studentId: row.studentId })}
        />
        {scoreSheet}
      </>
    );
  }

  return (
    <WorkspaceShell
      eyebrow={t("results.eyebrow", {
        title: exam.data?.courseTitle ?? "",
        label: exam.data?.templateKey?.toUpperCase() ?? "",
      })}
      title={exam.data?.title ?? ""}
      action={
        <button
          type="button"
          className={`${workspaceAction} disabled:opacity-60`}
          disabled={share.isPending || !participated.length}
          onClick={shareResults}
        >
          {t("results.share")}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("results.submitted")}
          value={`${participated.length} / ${rows.length}`}
        />
        <StatCard label={t("results.average")} value={score(average)} tone="text-brand-strong" />
        <StatCard label={t("results.best")} value={score(best)} tone="text-success-fg" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-lg bg-surface p-5">
            <strong className="text-title text-ink">{t("results.bySection")}</strong>
            <div className="grid gap-4 sm:grid-cols-4">
              {sectionAverages.map((section) => (
                <span key={section.key} className="flex min-w-0 flex-col gap-1.5">
                  <small className="truncate text-body-xs text-ink-tertiary">{section.title}</small>
                  <strong className="font-heading text-h1 text-ink">{score(section.value)}</strong>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                    <i
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, ((section.value ?? 0) / 9) * 100)}%` }}
                    />
                  </span>
                </span>
              ))}
              {!sectionAverages.length ? (
                <p className="text-body-sm text-ink-tertiary">{t("results.empty")}</p>
              ) : null}
            </div>
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-surface">
            <div
              className="grid items-center gap-3 bg-subtle px-5 py-3"
              style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${sectionKeys.length + 1}, 56px)` }}
            >
              <small className="truncate text-body-xs text-ink-secondary">
                {t("results.student")}
              </small>
              {sectionKeys.map(([key, title]) => (
                <small key={key} className="truncate text-body-xs text-ink-secondary">
                  {title.slice(0, 1)}
                </small>
              ))}
              <small className="truncate text-body-xs text-ink-secondary">
                {t("results.band")}
              </small>
            </div>

            {rows.map((row) => (
              <button
                key={row.studentId}
                type="button"
                className={`grid items-center gap-3 border-b border-line-subtle px-5 py-3.5 text-left transition-colors last:border-b-0 ${
                  picked === row.studentId ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${sectionKeys.length + 1}, 56px)` }}
                onClick={() => setPicked(row.studentId)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={row.studentName} src={row.avatarUrl ?? undefined} size="sm" />
                  <span className="min-w-0 truncate text-body text-ink">{row.studentName}</span>
                </span>

                {sectionKeys.map(([key]) => {
                  const section = row.sections.find((item) => item.key === key);
                  return (
                    <small key={key} className="text-body-sm text-ink-secondary">
                      {section ? score(section.score) : "—"}
                    </small>
                  );
                })}

                {row.participated ? (
                  <strong className="text-title-sm text-ink">{score(row.total?.score ?? null)}</strong>
                ) : (
                  <small className="text-body-sm text-danger">{t("results.notJoined")}</small>
                )}
              </button>
            ))}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {activeRow && writing ? (
            <WritingCard row={activeRow} sectionTitle={writing.title} answers={detail.data?.manualAnswers} />
          ) : (
            <p className="rounded-lg bg-surface px-5 py-6 text-center text-body-sm text-ink-tertiary">
              {t("results.pickStudent")}
            </p>
          )}

          {activeRow ? (
            <section className="flex flex-col gap-3 rounded-lg bg-brand-subtle p-5">
              <span className="flex items-center gap-3">
                <strong className="grid size-13 shrink-0 place-items-center rounded-md bg-brand font-heading text-h2 text-ink-inverse">
                  {score(activeRow.total?.score ?? null)}
                </strong>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-brand-strong">
                    {t("results.aiTitle")}
                  </strong>
                  <small className="truncate text-body-xs text-ink-secondary">
                    {activeRow.sections
                      .map((section) => `${section.title.slice(0, 2).toUpperCase()} ${score(section.score)}`)
                      .join(" · ")}
                  </small>
                </span>
              </span>

              <p className="text-body-xs text-ink-secondary">{t("results.aiHint")}</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-10 items-center justify-center rounded-full bg-surface text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
                  disabled={!writing || !activeRow.participated || requestAi.isPending}
                  onClick={() => requestAi.mutate(activeRow.studentId)}
                >
                  {t("results.aiRetry")}
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-50"
                  disabled={!activeRow.participated}
                  onClick={() => setScoring({ studentId: activeRow.studentId })}
                >
                  {t("results.grade")}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
      {scoreSheet}
    </WorkspaceShell>
  );
}

function WritingCard({
  row,
  sectionTitle,
  answers,
}: {
  row: ExamStudentResult;
  sectionTitle: string;
  answers?: ExamManualAnswer[];
}) {
  const { t } = useTranslation("exam");
  const text = answers?.find((answer) => answer.answer.length > 40)?.answer ?? "";
  const words = text ? text.trim().split(/\s+/).length : 0;

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
      <span className="flex items-center gap-3">
        <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">
          {row.studentName} · {sectionTitle}
        </strong>
        {words ? (
          <span className="flex h-6 shrink-0 items-center rounded-full bg-subtle px-2.5 text-caption-strong text-ink-secondary">
            {t("results.wordCount", { count: words })}
          </span>
        ) : null}
      </span>

      <p className="line-clamp-4 text-body-xs text-ink-secondary">
        {text ? `“${text}”` : <Icon name="description" size={16} />}
      </p>
    </section>
  );
}

function StatCard({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-5">
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
      <strong className={`font-heading text-display ${tone}`}>{value}</strong>
    </div>
  );
}

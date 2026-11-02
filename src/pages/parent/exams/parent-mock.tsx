import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { examApi, examKeys, useExamReminder, useExams } from "@/modules/exam";
import { useHomeworkReport } from "@/modules/homework";
import { parentResults, useSelectedChild } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { ConnectChild } from "../dashboard/home-empty";
import { ResultsTabs } from "../report/results-parts";
import { MockResultDialog } from "./mock-result-dialog";
import { band, bandTone, sectionIcon } from "./mock-styles";

const HEAD = "px-3 pb-3 text-left text-caption-strong tracking-wide text-ink-tertiary uppercase first:pl-5";

export function ParentMock() {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const [now] = useState(() => Date.now());
  const { children, childrenQuery, selectedChild, selectedChildId } = useSelectedChild();
  const enabled = Boolean(selectedChildId);
  const exams = useExams(null, enabled);
  const report = useHomeworkReport(selectedChildId, enabled);
  const reminder = useExamReminder();
  const [opened, setOpened] = useState<ExamSummary | null>(null);
  const [locked, setLocked] = useState<ExamSummary | null>(null);

  const courseIds = report.data
    ? new Set(report.data.courses.map((course) => course.courseId))
    : children.length <= 1
      ? null
      : new Set<string>();
  const list = (exams.data ?? [])
    .filter((exam) => !courseIds || courseIds.has(exam.courseId))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
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
  const next = parentResults.nextExam(list, now);
  const childName = selectedChild?.name ?? "";
  const first = childName.split(" ")[0] || childName;

  function toggleReminder(exam: ExamSummary) {
    reminder.mutate({ id: exam.id, enabled: !exam.hasReminder });
  }

  function overall(exam: ExamSummary) {
    if (exam.state !== "finished")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
          <Icon name="schedule" size={14} />
          {t(exam.state === "running" ? "mock.state.running" : "mock.state.upcoming")}
        </span>
      );
    const result = byExam.get(exam.id);
    if (hidden.has(exam.id) || (result && result.total === null && result.participated))
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
          <Icon name="pending" size={14} />
          {t("mock.state.pending")}
        </span>
      );
    if (result && !result.participated)
      return <span className="rounded-full bg-subtle px-2.5 py-1 text-caption-strong text-ink-secondary">{t("mock.state.absent")}</span>;
    if (result?.total?.score != null)
      return (
        <span className={`inline-flex rounded-xl px-3 py-1 font-heading text-[16px]/6 font-semibold ${bandTone(result.total.score)}`}>
          {band(result.total.score)}
        </span>
      );
    return <span className="text-body-sm text-ink-tertiary">—</span>;
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={childName ? `${t("mock.eyebrow")} · ${childName}` : t("mock.eyebrow")}
        title={t("results.title")}
      />
      {online && exams.isError ? <ParentErrorBanner onRetry={() => void exams.refetch()} /> : null}

      {!childrenQuery.isLoading && !selectedChild ? (
        <ConnectChild />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center">
            <ResultsTabs />
          </div>

          {next ? (
            <section className="flex items-center gap-4 rounded-[20px] bg-accent-teal-bg px-5 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-accent-teal-fg">
                <Icon name="event" size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-accent-teal-fg">
                  {t("mock.next", { title: next.title, date: formatLocalized(next.startsAt, t("mock.nextPattern")).toLowerCase() })}
                </strong>
                <small className="truncate text-body-xs text-accent-teal-fg">
                  {t("mock.minutes", { count: next.totalMinutes })} · {t("mock.resultAfter")}
                </small>
              </span>
              <button
                type="button"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
                disabled={reminder.isPending}
                onClick={() => toggleReminder(next)}
              >
                <Icon name={next.hasReminder ? "check" : "notifications"} size={18} />
                {next.hasReminder ? t("mock.reminderSet") : t("mock.remind")}
              </button>
            </section>
          ) : null}

          {list.length ? (
            <section className={`overflow-hidden rounded-[20px] bg-surface pt-5 ${exams.isLoading ? "animate-pulse" : ""}`}>
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[20%]" />
                  <col className="w-[12%]" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b border-line">
                    {(["exam", "date", "duration", "sections", "overall"] as const).map((column) => (
                      <th key={column} className={HEAD}>
                        {t(`mock.columns.${column}`)}
                      </th>
                    ))}
                    <th className={HEAD} />
                  </tr>
                </thead>
                <tbody>
                  {list.map((exam) => {
                    const result = byExam.get(exam.id);
                    const done = exam.state === "finished";
                    return (
                      <tr key={exam.id} className="border-b border-line last:border-b-0">
                        <td className="py-3.5 pr-3 pl-5">
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                                done ? "bg-accent-blue-bg text-accent-blue-fg" : "bg-accent-saffron-bg text-accent-saffron-fg"
                              }`}
                            >
                              <Icon name={done ? "quiz" : "lock"} size={20} />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <strong className="truncate text-title-sm text-ink">{exam.title}</strong>
                              <small className="truncate text-body-xs text-ink-secondary">{exam.courseTitle}</small>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 text-body-sm text-ink">{formatLocalized(exam.startsAt, t("homeworkView.shortPattern")).toLowerCase()}</td>
                        <td className="px-3 text-body-sm text-ink">{t("mock.minutesShort", { count: exam.totalMinutes })}</td>
                        <td className="px-3">
                          <span className="flex flex-wrap gap-1">
                            {(result?.sections ?? []).map((section) => (
                              <span key={section.key} className="inline-flex items-center gap-0.5 rounded-md bg-subtle px-1.5 py-0.5 text-[11px]/4 font-semibold text-ink-secondary">
                                <Icon name={sectionIcon(section.key, section.title)} size={11} />
                                {parentResults.sectionShort(section.title, section.key)} {section.score === null ? "…" : band(section.score)}
                              </span>
                            ))}
                            {!result?.sections.length ? <span className="text-body-sm text-ink-tertiary">—</span> : null}
                          </span>
                        </td>
                        <td className="px-3">{overall(exam)}</td>
                        <td className="pr-5 pl-3 text-right">
                          {done && result?.participated && !hidden.has(exam.id) ? (
                            <button
                              type="button"
                              className="h-10 rounded-full border border-line-strong bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
                              onClick={() => setOpened(exam)}
                            >
                              {t("mock.open")}
                            </button>
                          ) : !done || hidden.has(exam.id) ? (
                            <button
                              type="button"
                              className="inline-flex h-10 items-center gap-1 px-2 text-button text-brand transition-opacity hover:opacity-80"
                              onClick={() => setLocked(exam)}
                            >
                              <Icon name="lock" size={16} />
                              {t("mock.open")}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ) : exams.isLoading ? (
            <div className="h-[320px] animate-pulse rounded-[20px] bg-surface" aria-hidden="true" />
          ) : (
            <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-16 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
                <Icon name="quiz" size={30} />
              </span>
              <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("mock.empty.title")}</strong>
              <p className="max-w-[320px] text-body-sm text-ink-secondary">{t("mock.empty.text")}</p>
            </section>
          )}
        </div>
      )}

      <MockResultDialog
        exam={opened}
        result={opened ? (byExam.get(opened.id) ?? null) : null}
        delta={opened ? parentResults.previousOverall(opened, list, byExam) : null}
        groupAverage={opened ? (groupAverage.get(opened.id) ?? null) : null}
        childId={selectedChildId ?? ""}
        childName={childName}
        childAvatar={selectedChild?.avatarUrl ?? null}
        onClose={() => setOpened(null)}
      />
      <ConfirmDialog
        alert
        tone="brand"
        open={Boolean(locked)}
        onOpenChange={(open) => {
          if (!open) setLocked(null);
        }}
        icon="lock"
        title={t("mock.locked.title")}
        description={
          locked
            ? t("mock.locked.text", {
                exam: locked.title,
                date: formatLocalized(locked.endsAt, t("mock.nextPattern")).toLowerCase(),
                name: first,
              })
            : ""
        }
        confirmLabel={
          locked?.state === "upcoming" ? (locked.hasReminder ? t("mock.reminderSet") : t("mock.remind")) : t("mock.locked.ok")
        }
        cancelLabel={t("mock.locked.close")}
        pending={reminder.isPending}
        onConfirm={() => {
          if (locked?.state === "upcoming" && !locked.hasReminder) toggleReminder(locked);
          setLocked(null);
        }}
      />
    </div>
  );
}

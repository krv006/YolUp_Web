import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  examApi,
  examKeys,
  ExamCreateDialog,
  ExamTemplateDialog,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExamCurrent,
  useExamResults,
  useExamTemplates,
  useExams,
} from "@/modules/exam";
import { useCourses } from "@/modules/course";
import { useQuizzes } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MobileAlertDialog } from "@/shared/ui/mobile-alert-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { ExamSummary } from "@/shared/types";
import { AppDialog } from "@/shared/ui/app-dialog";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { MobileMockList } from "./mobile-mock-list";

const STATE_TONE: Record<string, string> = {
  running: "bg-danger-bg text-danger",
  scheduled: "bg-subtle text-ink-secondary",
  finished: "bg-accent-green-bg text-success-fg",
};

function clock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function MockExamsPage() {
  const { t } = useTranslation("exam");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const [params, setParams] = useSearchParams();
  const exams = useExams(null);
  const remove = useDeleteExam();
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const courses = useCourses();
  const examTemplates = useExamTemplates();
  const quizzes = useQuizzes(null);
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(() => params.get("new") === "1");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExamSummary | null>(null);

  const items = useMemo(() => exams.data ?? [], [exams.data]);
  const live = items.find((exam) => exam.state === "running") ?? null;
  const current = useExamCurrent(live?.id ?? null, live ? 15_000 : false);
  const liveResults = useExamResults(live?.id ?? null, Boolean(live));

  const templates = useMemo(() => {
    const map = new Map<string, number>();
    for (const exam of items) map.set(exam.templateKey, (map.get(exam.templateKey) ?? 0) + 1);
    return [...map.entries()];
  }, [items]);

  const visible = filter === "all" ? items : items.filter((exam) => exam.templateKey === filter);

  const remaining = current.data
    ? (new Date(current.data.endsAt).getTime() - new Date(current.data.serverNow).getTime()) / 1000
    : null;

  const finished = useQueries({
    queries: (isCompact ? items.filter((exam) => exam.state === "finished") : []).map((exam) => ({
      queryKey: examKeys.results(exam.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => examApi.getResults(exam.id, { signal }),
    })),
  });

  function changeCreateOpen(open: boolean) {
    setCreateOpen(open);
    if (!open && params.has("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }

  const liveRows = liveResults.data?.results ?? [];
  const joined = liveRows.filter((row) => row.participated).length;
  const warnings = liveRows.reduce((sum, row) => sum + (row.integrity?.away ?? 0), 0);

  const dialogs = (
    <>
      <ExamCreateDialog
        open={createOpen}
        pending={create.isPending}
        courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title, studentCount: course.studentCount ?? 0 }))}
        templates={examTemplates.data ?? []}
        quizzes={quizzes.data ?? []}
        onOpenChange={changeCreateOpen}
        onCreateTemplate={() => setTemplateOpen(true)}
        onCreate={(values) => create.mutateAsync(values).then(() => changeCreateOpen(false))}
      />

      <ExamTemplateDialog
        open={templateOpen}
        pending={createTemplate.isPending}
        onOpenChange={setTemplateOpen}
        onCreate={(values) => createTemplate.mutateAsync(values).then(() => setTemplateOpen(false))}
      />
    </>
  );

  if (isCompact) {
    const finishedExams = items.filter((exam) => exam.state === "finished");
    return (
      <>
        <MobileMockList
          exams={visible}
          loading={exams.isLoading}
          chips={[
            { id: "all", label: t("mock.filters.all") },
            ...templates.map(([key]) => ({ id: key, label: t(`mock.templates.${key}`, { defaultValue: key.toUpperCase() }) })),
          ]}
          filter={filter}
          sectionCount={(exam) => {
            const template = (examTemplates.data ?? []).find(
              (item) => item.id === exam.templateKey || item.name.toLowerCase() === exam.templateKey.toLowerCase()
            );
            return template ? template.items.filter((item) => item.kind === "section").length : null;
          }}
          summary={(exam) => {
            const data = finished[finishedExams.indexOf(exam)]?.data;
            if (!data) return null;
            const done = data.results.filter((row) => row.participated);
            const totals = done.map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
            return {
              submitted: done.length,
              total: data.results.length,
              average: totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null,
            };
          }}
          onFilterChange={setFilter}
          onBack={() => navigate(ROUTES.teacher.workspace)}
          onCreate={() => changeCreateOpen(true)}
          onOpen={(exam) => navigate(ROUTES.teacher.mockResults(exam.id))}
          onDelete={setDeleting}
        />
        <MobileAlertDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => !open && setDeleting(null)}
          icon="delete"
          tone="danger"
          title={t("mock.deleteTitle")}
          description={t("mock.deleteDescription", { title: deleting?.title ?? "" })}
          cancelLabel={t("mock.cancel")}
          confirmLabel={t("mock.delete")}
          confirmTone="danger"
          pending={remove.isPending}
          onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        />
        {dialogs}
      </>
    );
  }

  return (
    <WorkspaceShell
      eyebrow={t("mock.eyebrow")}
      title={t("mock.title")}
      action={
        <button type="button" className={workspaceAction} onClick={() => changeCreateOpen(true)}>
          {t("mock.create")}
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          label={t("mock.filters.all")}
          count={items.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {templates.map(([key, count]) => (
          <Chip
            key={key}
            label={t(`mock.templates.${key}`, { defaultValue: key.toUpperCase() })}
            count={count}
            active={filter === key}
            onClick={() => setFilter(key)}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-3">
          {visible.map((exam) => (
            <ExamRow
              key={exam.id}
              exam={exam}
              onOpen={() => navigate(ROUTES.teacher.mockResults(exam.id))}
              onDelete={() => setDeleting(exam)}
            />
          ))}

          {!exams.isLoading && !visible.length ? (
            <p className="rounded-lg bg-surface px-5 py-10 text-center text-body-sm text-ink-tertiary">
              {t("mock.empty")}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {live ? (
            <section className="flex flex-col gap-2 rounded-lg bg-brand p-5 text-ink-inverse">
              <span className="flex items-center gap-2">
                <span className="flex h-6 items-center gap-1.5 rounded-full bg-surface/20 px-2.5 text-caption-strong">
                  <i className="size-1.5 rounded-full bg-danger not-italic" />
                  {t("mock.liveBadge")}
                </span>
                <small className="min-w-0 flex-1 truncate text-body-xs">
                  {live.title}
                  {current.data?.item ? ` · ${current.data.item.title}` : ""}
                </small>
              </span>

              <strong className="font-heading font-numeric text-display">
                {remaining === null ? "—" : clock(remaining)}
              </strong>

              <small className="text-body-xs opacity-90">
                {t("mock.liveMeta", {
                  joined,
                  total: liveRows.length,
                  warnings,
                })}
              </small>
            </section>
          ) : null}

          {live ? (
            <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
              {liveRows.map((row) => {
                const done = Boolean(row.finishedAt);
                const away = row.integrity?.away ?? 0;
                return (
                  <span key={row.studentId} className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={row.studentName} size="sm" />
                      <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">
                        {row.studentName}
                      </strong>
                      {away ? (
                        <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-warning-bg px-2 text-caption-strong text-warning-fg">
                          <Icon name="warning" size={12} />
                          {t("mock.awayCount", { count: away })}
                        </span>
                      ) : null}
                    </span>

                    <small className="truncate text-body-xs text-ink-tertiary">
                      {row.participated
                        ? row.answered != null && row.questionsTotal
                          ? t("mock.answeredCount", {
                              answered: row.answered,
                              total: row.questionsTotal,
                            })
                          : done
                            ? t("mock.finished")
                            : t("mock.inProgress")
                        : t("mock.notJoined")}
                    </small>

                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <i
                        className={`block h-full rounded-full ${
                          done ? "bg-success" : row.participated ? "bg-brand" : "bg-line"
                        }`}
                        style={{
                          width: done
                            ? "100%"
                            : row.participated
                              ? `${
                                  row.answered != null && row.questionsTotal
                                    ? Math.round((row.answered / row.questionsTotal) * 100)
                                    : 45
                                }%`
                              : "0%",
                        }}
                      />
                    </span>
                  </span>
                );
              })}
            </section>
          ) : null}
        </div>
      </div>
      <AppDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        variant="confirm"
        layout="stacked"
        width="lg:w-85"
        icon={
          <span className="grid size-12 place-items-center rounded-md bg-danger-bg text-danger">
            <Icon name="delete" size={22} />
          </span>
        }
        title={t("mock.deleteTitle")}
        description={t("mock.deleteDescription", { title: deleting?.title ?? "" })}
        footer={
          <>
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
              onClick={() => setDeleting(null)}
            >
              {t("mock.cancel")}
            </button>
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center rounded-full bg-danger-bg px-4 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
              disabled={remove.isPending}
              onClick={() => {
                if (!deleting) return;
                remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
              }}
            >
              {t("mock.delete")}
            </button>
          </>
        }
      />

      {dialogs}
    </WorkspaceShell>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-label transition-colors ${
        active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary hover:text-ink"
      }`}
      onClick={onClick}
    >
      {label} · {count}
    </button>
  );
}

function ExamRow({
  exam,
  onOpen,
  onDelete,
}: {
  exam: ExamSummary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("exam");
  const finished = exam.state === "finished";
  const running = exam.state === "running";

  return (
    <article className="flex items-center gap-3 rounded-lg bg-surface p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-violet-bg text-accent-violet-fg">
        <Icon name="emoji-events" size={22} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-title-lg text-ink">{exam.title}</strong>
          <span
            className={`flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption-strong ${
              STATE_TONE[exam.state] ?? STATE_TONE.scheduled
            }`}
          >
            {running ? <i className="size-1.5 rounded-full bg-danger not-italic" /> : null}
            {t(`mock.state.${exam.state}`, { defaultValue: exam.state })}
          </span>
        </span>
        <small className="truncate text-body-xs text-ink-tertiary">
          {exam.courseTitle} · {t("mock.minutes", { count: exam.totalMinutes })}
        </small>
      </span>

      {running ? (
        <button
          type="button"
          className="flex h-10 shrink-0 items-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
          onClick={onOpen}
        >
          {t("mock.watch")}
        </button>
      ) : finished ? (
        <button
          type="button"
          className="flex h-10 shrink-0 items-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
          onClick={onOpen}
        >
          {t("mock.results")}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={onOpen}
          >
            {t("mock.edit")}
          </button>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-icon-tertiary transition-colors hover:bg-danger-bg hover:text-danger"
            aria-label={t("mock.delete")}
            onClick={onDelete}
          >
            <Icon name="trash" size={18} />
          </button>
        </>
      )}
    </article>
  );
}

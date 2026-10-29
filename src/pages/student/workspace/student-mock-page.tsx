import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatClock, secondsUntil, syncServerTime, useExamCurrent, useExamReminder } from "@/modules/exam";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ExamSummary } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell } from "@/widgets/workspace-shell";
import { sameDay, shortDateTime } from "../lib/format";
import { FilterChips } from "./filter-chips";
import { useStudentWorkspace } from "./use-student-workspace";

const STATE_CHIP: Record<ExamSummary["state"], string> = {
  running: "bg-danger-bg text-error-text",
  upcoming: "bg-brand-subtle text-brand",
  finished: "bg-success-bg text-success-fg",
};

export function StudentMockPage() {
  const { t } = useTranslation("student");
  const { t: te } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const data = useStudentWorkspace();
  const [filter, setFilter] = useState("all");
  const reminder = useExamReminder();

  function toggleReminder(exam: ExamSummary) {
    const enabled = !exam.hasReminder;
    reminder.mutate(
      { id: exam.id, enabled },
      {
        onSuccess: (minutes) =>
          toast.success(
            enabled
              ? t("workspace.mock.reminderSet", { count: minutes ?? 15 })
              : t("workspace.mock.reminderCleared")
          ),
      }
    );
  }

  const items = [...data.exams].sort((a, b) => {
    const rank = { running: 0, upcoming: 1, finished: 2 };
    return rank[a.state] - rank[b.state] || (a.state === "finished" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt));
  });
  const templates = [...new Set(items.map((exam) => exam.templateKey))];
  const visible = filter === "all" ? items : items.filter((exam) => exam.templateKey === filter);
  const live = items.find((exam) => exam.state === "running") ?? null;
  const chips = [
    { id: "all", label: `${t("workspace.mock.filters.all")} · ${items.length}` },
    ...templates.map((key) => ({
      id: key,
      label: `${te(`mock.templates.${key}`, { defaultValue: key.toUpperCase() })} · ${items.filter((exam) => exam.templateKey === key).length}`,
    })),
  ];

  function length(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return t("workspace.mock.minutesOnly", { count: rest });
    return rest ? t("workspace.mock.hoursMinutes", { hours, minutes: rest }) : t("workspace.mock.hours", { count: hours });
  }

  function when(exam: ExamSummary): string {
    const start = new Date(exam.startsAt);
    if (sameDay(start, data.now))
      return t("workspace.mock.today", {
        time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      });
    return shortDateTime(start, months);
  }

  const list = (
    <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
      {data.examsLoading
        ? Array.from({ length: 3 }, (_, index) => <i key={index} className="h-20 rounded-2xl bg-surface" aria-hidden="true" />)
        : null}
      {visible.map((exam) => (
        <article
          key={exam.id}
          className="grid min-h-20 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-surface px-4 py-3 lg:flex lg:px-[18px]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">
            <Icon name="emoji-events" size={22} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <strong className="truncate text-title text-ink">{exam.title}</strong>
              <span className={`flex h-5 shrink-0 items-center gap-1 rounded-full px-1.5 text-caption-strong ${STATE_CHIP[exam.state]}`}>
                {exam.state === "running" ? <i className="size-1.5 rounded-full bg-error-text not-italic" /> : null}
                {t(`workspace.mock.states.${exam.state}`)}
              </span>
            </span>
            <small className="truncate text-body-xs text-ink-secondary">
              {[exam.courseTitle, when(exam), length(exam.totalMinutes)].filter(Boolean).join(" · ")}
            </small>
          </span>
          {exam.state === "running" ? (
            <button
              type="button"
              className="col-span-2 flex h-[42px] shrink-0 items-center justify-center rounded-full bg-brand-subtle px-3.5 text-body-sm font-semibold text-brand transition-colors hover:bg-tint"
              onClick={() => navigate(ROUTES.student.mockExam(exam.id))}
            >
              {t("workspace.mock.continue")}
            </button>
          ) : exam.state === "finished" ? (
            <button
              type="button"
              className="col-span-2 flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
              onClick={() => navigate(ROUTES.student.mockResults(exam.id))}
            >
              {t("workspace.mock.result")}
              {exam.myTotal?.label || exam.myTotal?.score != null ? (
                <span className="rounded-full bg-success-bg px-2 py-0.5 text-caption-strong text-success-fg">
                  {exam.myTotal.label || exam.myTotal.score}
                </span>
              ) : null}
            </button>
          ) : (
            <button
              type="button"
              aria-pressed={exam.hasReminder}
              disabled={reminder.isPending && reminder.variables?.id === exam.id}
              className={`col-span-2 flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-body-sm font-semibold transition-colors ${
                exam.hasReminder
                  ? "bg-brand-subtle text-brand hover:bg-tint"
                  : "border border-line-strong bg-surface text-ink hover:bg-subtle"
              }`}
              onClick={() => toggleReminder(exam)}
            >
              <Icon name={exam.hasReminder ? "notifications-off" : "notifications"} size={18} />
              {exam.hasReminder
                ? t("workspace.mock.reminderOn", { count: exam.reminderMinutes ?? 15 })
                : t("workspace.mock.remind")}
            </button>
          )}
        </article>
      ))}
      {!data.examsLoading && !visible.length ? (
        <MobileEmptyCard icon="emoji-events" title={t("workspace.mock.emptyTitle")} description={t("workspace.mock.emptyHint")} />
      ) : null}
    </div>
  );

  if (isCompact)
    return (
      <main className="flex h-full flex-col gap-5 overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-32 font-body text-ink [&>*]:shrink-0">
        <MobilePageHeader
          title={t("workspace.mock.title")}
          backLabel={t("workspace.back")}
          onBack={() => navigate(ROUTES.student.workspace)}
        />
        {live ? <LiveCard exam={live} /> : null}
        {templates.length > 1 ? <FilterChips compact items={chips} value={filter} onChange={setFilter} /> : null}
        {list}
      </main>
    );

  return (
    <WorkspaceShell eyebrow={t("workspace.mock.eyebrow")} title={t("workspace.mock.title")}>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          <FilterChips items={chips} value={filter} onChange={setFilter} />
          {list}
        </div>
        {live ? <LiveCard exam={live} /> : null}
      </div>
    </WorkspaceShell>
  );
}

function LiveCard({ exam }: { exam: ExamSummary }) {
  const { t } = useTranslation("student");
  const navigate = useNavigate();
  const current = useExamCurrent(exam.id, 30_000);
  const [, setTick] = useState(0);

  useEffect(() => {
    syncServerTime(current.data?.serverNow ?? exam.serverNow);
  }, [current.data?.serverNow, exam.serverNow]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const section = current.data?.item?.title ?? "";
  const remaining = secondsUntil(current.data?.item?.endsAt ?? current.data?.endsAt ?? exam.endsAt);

  return (
    <section className="flex flex-col rounded-2xl bg-brand p-[18px] text-ink-inverse">
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-surface px-2 text-caption-strong text-error-text uppercase">
          <i className="size-2 rounded-full bg-error-text not-italic" />
          {t("workspace.mock.live")}
        </span>
        <small className="truncate text-body-xs">{[exam.title, section].filter(Boolean).join(" · ")}</small>
      </span>
      <strong className="mt-3 font-heading text-[48px]/[56px] font-bold tabular-nums">{formatClock(remaining)}</strong>
      <small className="mt-2 text-body-xs">
        {section ? t("workspace.mock.leftSection", { section }) : t("workspace.mock.left")}
      </small>
      <button
        type="button"
        className="mt-3 flex h-[42px] items-center justify-center gap-2 rounded-full bg-surface text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
        onClick={() => navigate(ROUTES.student.mockExam(exam.id))}
      >
        <Icon name="arrow-forward" size={18} />
        {t("workspace.mock.back")}
      </button>
    </section>
  );
}

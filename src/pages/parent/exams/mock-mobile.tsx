import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import type { ExamSummary } from "@/shared/types";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileEmptyCard, MobileTitleHeader } from "@/shared/ui/mobile-page";
import { ParentErrorBanner } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { ResultsTabs } from "../report/results-parts";
import { MockResultDialog } from "./mock-result-dialog";
import { band, bandTone } from "./mock-styles";
import { useMockView } from "./use-mock-view";

export function MockMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const view = useMockView();
  const [pending, setPending] = useState<ExamSummary | null>(null);
  const [locked, setLocked] = useState<ExamSummary | null>(null);
  const childName = view.child?.name ?? "";
  const rest = view.list.filter((exam) => exam.id !== view.next?.id);

  function open(exam: ExamSummary) {
    const result = view.byExam.get(exam.id);
    if (exam.state !== "finished" || view.hidden.has(exam.id)) return setLocked(exam);
    if (!result?.participated) return;
    if (result.total?.score == null) return setPending(exam);
    navigate(ROUTES.parent.examResult(exam.id));
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <MobileTitleHeader eyebrow={t("results.eyebrow")} title={t("results.title")} />
      <ResultsTabs wide />
      {online && view.exams.isError ? <ParentErrorBanner onRetry={() => void view.exams.refetch()} /> : null}
      {!view.childrenLoading && !view.child ? (
        <MobileConnect />
      ) : view.exams.isLoading ? (
        <span className="h-[320px] animate-pulse rounded-[20px] bg-surface" aria-hidden="true" />
      ) : !view.list.length ? (
        <MobileEmptyCard icon="quiz" title={t("mock.empty.title")} description={t("mock.empty.text")} />
      ) : (
        <>
          {view.next ? (
            <button
              type="button"
              className="flex items-center gap-3 rounded-[20px] bg-accent-teal-bg px-4 py-4 text-left"
              onClick={() => setLocked(view.next)}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-accent-teal-fg">
                <Icon name="event" size={22} />
              </span>
              <span className="flex min-w-0 flex-col">
                <strong className="truncate text-title-sm text-accent-teal-fg">
                  {view.next.title} — {formatLocalized(view.next.startsAt, t("mobile.mock.dayPattern")).toLowerCase()}
                </strong>
                <small className="text-body-xs text-accent-teal-fg">
                  {formatLocalized(view.next.startsAt, "HH:mm")} · {t("mock.minutes", { count: view.next.totalMinutes })} · {t("mock.resultAfter")}
                </small>
              </span>
            </button>
          ) : null}
          {rest.length ? (
            <>
              <h2 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">{t("mobile.mock.finished")}</h2>
              <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
                {rest.map((exam) => {
                  const result = view.byExam.get(exam.id);
                  const score = result?.total?.score ?? null;
                  const done = exam.state === "finished" && !view.hidden.has(exam.id);
                  return (
                    <li key={exam.id} className="border-b border-line last:border-b-0">
                      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => open(exam)}>
                        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${done ? "bg-accent-blue-bg text-accent-blue-fg" : "bg-accent-saffron-bg text-accent-saffron-fg"}`}>
                          <Icon name={done ? "quiz" : "lock"} size={22} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <strong className="truncate text-title-sm text-ink">{exam.title}</strong>
                          <small className="truncate text-body-xs text-ink-secondary">
                            {[formatLocalized(exam.startsAt, t("homeworkView.shortPattern")).toLowerCase(), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle].join(" · ")}
                          </small>
                        </span>
                        {score !== null && done ? (
                          <span className={`flex shrink-0 flex-col items-center rounded-xl px-2.5 py-1 ${bandTone(score)}`}>
                            <strong className="font-heading text-[18px]/6 font-semibold">{band(score)}</strong>
                            <small className="text-[10px]/3 font-semibold">band</small>
                          </span>
                        ) : done && result && !result.participated ? (
                          <span className="shrink-0 rounded-full bg-subtle px-2.5 py-1 text-caption-strong text-ink-secondary">{t("mock.state.absent")}</span>
                        ) : (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
                            <Icon name={done ? "pending" : "schedule"} size={14} />
                            {done ? t("mock.state.pending") : t(exam.state === "running" ? "mock.state.running" : "mock.state.upcoming")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </>
      )}

      <MockResultDialog
        exam={pending}
        result={pending ? (view.byExam.get(pending.id) ?? null) : null}
        delta={pending ? parentResults.previousOverall(pending, view.list, view.byExam) : null}
        groupAverage={pending ? (view.groupAverage.get(pending.id) ?? null) : null}
        childId={view.childId ?? ""}
        childName={childName}
        childAvatar={view.child?.avatarUrl ?? null}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        alert
        tone="brand"
        open={Boolean(locked)}
        onOpenChange={(value) => {
          if (!value) setLocked(null);
        }}
        icon="lock"
        title={t("mock.locked.title")}
        description={
          locked
            ? t("mock.locked.text", { exam: locked.title, date: formatLocalized(locked.endsAt, t("mock.nextPattern")).toLowerCase(), name: childName.split(" ")[0] })
            : ""
        }
        confirmLabel={locked?.state === "upcoming" ? (locked.hasReminder ? t("mock.reminderSet") : t("mock.remind")) : t("mock.locked.ok")}
        cancelLabel={t("mock.locked.close")}
        pending={view.reminder.isPending}
        onConfirm={() => {
          if (locked?.state === "upcoming" && !locked.hasReminder) view.toggleReminder(locked);
          setLocked(null);
        }}
      />
    </div>
  );
}

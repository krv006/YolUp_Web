import { useState } from "react";
import { CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HomeworkResultDialog } from "@/modules/homework";
import type { Submission } from "@/shared/types";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { formatDayTime } from "@/shared/lib";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";

function SubmissionPill({
  submission,
  onOpen,
}: {
  submission: Submission | null;
  onOpen: (submission: Submission) => void;
}) {
  const { t } = useTranslation("parent");
  if (!submission) return <span className="grade-pill">{t("homework.notSubmitted")}</span>;
  if (submission.status === "done")
    return (
      <button className="grade-pill grade-pill--button" onClick={() => onOpen(submission)} aria-label={t("homework.openResultAria")}>
        <CheckCircle2 size={15} /> {submission.overallScore} ball · {submission.grade}
      </button>
    );
  if (submission.status === "checking")
    return (
      <button className="grade-pill grade-pill--button grade-pill--checking" onClick={() => onOpen(submission)} aria-label={t("homework.openCheckingAria")}>
        <Clock3 size={14} /> {t("homework.checking")}
      </button>
    );
  return (
    <button className="grade-pill grade-pill--button grade-pill--error" onClick={() => onOpen(submission)} aria-label={t("homework.openErrorAria")}>
      {t("homework.checkError")}
    </button>
  );
}

export function ParentHomeworkPage() {
  const { t } = useTranslation("parent");
  const { selectedChild, selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [resultOf, setResultOf] = useState<Submission | null>(null);

  if (!selectedChild)
    return (
      <div className="portal-empty">
        <ListChecks size={30} />
        <h2>{t("homework.noChildTitle")}</h2>
        <p>{t("homework.noChildDescription")}</p>
      </div>
    );
  if (homework.isLoading) return <LoadingFallback label={t("homework.loading")} />;
  if (homework.isError)
    return (
      <RouteState
        title={t("homework.loadError")}
        description={homework.error.message}
        actionLabel={t("homework.retry")}
        onAction={homework.refetch}
      />
    );

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("homework.eyebrow")}</span>
          <h1>{selectedChild.name}</h1>
          <p>{t("homework.subtitle")}</p>
        </div>
      </div>
      <section className="portal-card parent-homework-list px-5">
        {(homework.data ?? []).map((item) => (
          <article key={item.id}>
            <span className="workspace-list-icon"><ListChecks size={19} /></span>
            <div>
              <strong>{item.title}</strong>
              <small>
                {item.courseTitle} ·{" "}
                {item.dueAt ? formatDayTime(item.dueAt) : t("homework.noDue")}
              </small>
            </div>
            <SubmissionPill submission={item.mySubmission} onOpen={setResultOf} />
          </article>
        ))}
        {!homework.data?.length ? (
          <div className="portal-empty">
            <ListChecks size={28} />
            <h2>{t("homework.emptyTitle")}</h2>
          </div>
        ) : null}
      </section>

      <HomeworkResultDialog
        submissionId={resultOf?.id}
        initial={resultOf}
        open={Boolean(resultOf)}
        onOpenChange={(open) => { if (!open) setResultOf(null); }}
        canDownloadFile
        title={t("homework.resultDialogTitle", { name: selectedChild.name })}
      />
    </div>
  );
}

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExamResultCard, useExamResults, useExams } from "@/modules/exam";
import { useSelectedChild } from "@/modules/parent";
import { toIntlLocale } from "@/shared/i18n";
import type { ExamSummary } from "@/shared/types";
import { Button, Dialog, DialogContent, LoadingFallback, RouteState } from "@/shared/ui/legacy";

export function ParentExamsPage() {
  const { t, i18n } = useTranslation("exam");
  const { selectedChild } = useSelectedChild();
  const exams = useExams(null);
  const [resultOf, setResultOf] = useState<ExamSummary | null>(null);

  if (!selectedChild)
    return (
      <div className="portal-empty">
        <ClipboardCheck size={30} />
        <h2>{t("parentList.noChildTitle")}</h2>
        <p>{t("parentList.noChildDescription")}</p>
      </div>
    );
  if (exams.isLoading) return <LoadingFallback label={t("list.loading")} />;
  if (exams.isError)
    return (
      <RouteState
        eyebrow={t("list.eyebrow")}
        title={t("list.loadError")}
        description={exams.error?.message}
        actionLabel={t("list.retry")}
        onAction={exams.refetch}
      />
    );

  const list = exams.data ?? [];

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("list.eyebrow")}</span>
          <h1>{selectedChild.name}</h1>
          <p>{t("parentList.subtitle")}</p>
        </div>
      </div>

      {list.length ? (
        <div className="student-workspace-list">
          {list.map((exam) => (
            <article key={exam.id}>
              <span className="workspace-list-icon">
                <ClipboardCheck size={20} />
              </span>
              <div>
                <strong>
                  {exam.title}
                  <span className={`exam-state-badge is-${exam.state}`}>{t(`state.${exam.state}`)}</span>
                </strong>
                <small>
                  {exam.courseTitle ? `${exam.courseTitle} · ` : ""}
                  {formatStart(exam, i18n.language)} · {t("list.minutes", { count: exam.totalMinutes })}
                </small>
              </div>
              {exam.state === "finished" ? (
                <Button size="sm" variant="secondary" onClick={() => setResultOf(exam)}>
                  {t("list.openResult")}
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="premium-empty">
          <ClipboardCheck size={30} />
          <h3>{t("list.empty")}</h3>
        </div>
      )}

      <Dialog
        open={Boolean(resultOf)}
        onOpenChange={(open) => {
          if (!open) setResultOf(null);
        }}
      >
        {resultOf ? (
          <DialogContent
            className="exam-results-dialog"
            title={t("parentList.resultTitle", { name: selectedChild.name })}
            description={resultOf.title}
          >
            <ChildExamResult examId={resultOf.id} childId={selectedChild.id} />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function ChildExamResult({ examId, childId }: { examId: string; childId: string }) {
  const { t } = useTranslation("exam");
  const results = useExamResults(examId);

  if (results.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (results.isError) return <p className="exam-result-loading">{t("result.loadError")}</p>;
  if (results.data?.hidden) return <p className="exam-result-loading">{t("parentList.hidden")}</p>;

  const result = results.data?.results.find((item) => item.studentId === childId);
  if (!result) return <p className="exam-result-loading">{t("parentList.notInExam")}</p>;
  if (!result.participated) return <p className="exam-result-loading">{t("result.absent")}</p>;

  return <ExamResultCard result={result} />;
}

function formatStart(exam: ExamSummary, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(exam.startsAt));
}

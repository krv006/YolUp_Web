import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toIntlLocale } from "@/shared/i18n";
import { ExamCountdown, useExams } from "@/modules/exam";
import type { ExamSummary } from "@/shared/types";
import { Button, LoadingFallback, PageBackLink, RouteState } from "@/shared/ui/legacy";

export function StudentExamsPage() {
  const { t, i18n } = useTranslation("exam");
  const navigate = useNavigate();
  const exams = useExams(null);

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
          <PageBackLink />
          <span className="portal-eyebrow">{t("list.eyebrow")}</span>
          <h1>{t("list.title")}</h1>
          <p>{t("list.subtitle")}</p>
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
              {exam.state === "upcoming" ? <ExamCountdown startsAt={exam.startsAt} /> : null}
              <Button
                size="sm"
                variant={exam.state === "running" ? "primary" : "secondary"}
                disabled={exam.state === "upcoming"}
                onClick={() => navigate(`../exams/${exam.id}`)}
              >
                {exam.state === "finished" ? t("list.openResult") : t("list.enter")}
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="premium-empty">
          <ClipboardCheck size={30} />
          <h3>{t("list.empty")}</h3>
        </div>
      )}
    </div>
  );
}

function formatStart(exam: ExamSummary, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(exam.startsAt));
}

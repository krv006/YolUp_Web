import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useExamResultPdf } from "@/modules/exam";
import { downloadBlob, parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader, mobileRoundButton } from "@/shared/ui/mobile-page";
import { MockResultBody } from "./mock-result-dialog";
import { useMockView } from "./use-mock-view";

export function ParentExamResultPage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { examId = "" } = useParams();
  const compact = useIsCompact();
  const view = useMockView();
  const pdf = useExamResultPdf();
  if (!compact) return <Navigate to={ROUTES.parent.exams} replace />;

  const exam = view.list.find((item) => item.id === examId) ?? null;
  const result = exam ? (view.byExam.get(exam.id) ?? null) : null;
  if (!view.loading && !exam) return <Navigate to={ROUTES.parent.exams} replace />;

  async function download() {
    if (!exam || !view.childId) return;
    try {
      downloadBlob(`${exam.title}.pdf`, await pdf.mutateAsync({ examId: exam.id, studentId: view.childId }));
    } catch {
      return;
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader
        title={t("mobile.mock.resultTitle")}
        backLabel={t("results.title")}
        onBack={() => navigate(ROUTES.parent.exams)}
        action={
          result?.total?.score != null ? (
            <button type="button" className={mobileRoundButton} aria-label={t("mock.result.pdf")} disabled={pdf.isPending} onClick={() => void download()}>
              <Icon name="download" size={22} />
            </button>
          ) : undefined
        }
      />
      {exam && result ? (
        <>
          <span className="flex flex-col px-1">
            <strong className="text-title text-ink">{exam.title}</strong>
            <small className="text-body-xs text-ink-secondary">
              {[formatLocalized(exam.startsAt, t("mock.result.datePattern")), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle].filter(Boolean).join(" · ")}
            </small>
          </span>
          <MockResultBody result={result} delta={parentResults.previousOverall(exam, view.list, view.byExam)} groupAverage={view.groupAverage.get(exam.id) ?? null} />
        </>
      ) : (
        <span className="h-[360px] animate-pulse rounded-[24px] bg-surface" aria-hidden="true" />
      )}
    </div>
  );
}

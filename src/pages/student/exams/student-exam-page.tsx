import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ExamRunner, useExam, useExamCurrent } from "@/modules/exam";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";

export function StudentExamPage() {
  const { t } = useTranslation("exam");
  const { examId } = useParams();
  const navigate = useNavigate();
  const exam = useExam(examId ?? null);
  const current = useExamCurrent(examId ?? null);
  if (current.isLoading || exam.isLoading) return <LoadingFallback label={t("runner.loading")} />;
  if (current.isError)
    return (
      <RouteState
        eyebrow={t("list.eyebrow")}
        title={t("runner.loadError")}
        description={current.error?.message}
        actionLabel={t("list.retry")}
        onAction={current.refetch}
      />
    );
  if (!current.data) return null;

  return (
    <div className="exam-page">
      <ExamRunner
        examId={examId as string}
        title={exam.data?.title ?? ""}
        current={current.data}
        onRefresh={() => void current.refetch()}
        onExit={() => navigate("../exams")}
      />
    </div>
  );
}

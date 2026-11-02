import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HomeworkReportView, useHomeworkReport } from "@/modules/homework";
import { useSelectedChild } from "@/modules/parent";
import { LoadingFallback, RouteState } from "@/shared/ui/legacy";

export function ParentReportLegacy() {
  const { t } = useTranslation("parent");
  const { selectedChild, selectedChildId } = useSelectedChild();
  const report = useHomeworkReport(selectedChildId, Boolean(selectedChildId));

  if (!selectedChild)
    return (
      <div className="portal-empty">
        <Trophy size={30} />
        <h2>{t("report.noChildTitle")}</h2>
        <p>{t("report.noChildDescription")}</p>
      </div>
    );
  if (report.isLoading) return <LoadingFallback label={t("report.loading")} />;
  if (report.isError || !report.data)
    return (
      <RouteState
        eyebrow={t("report.eyebrow")}
        title={t("report.loadError")}
        description={report.error?.message}
        actionLabel={t("report.retry")}
        onAction={report.refetch}
      />
    );

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("report.eyebrow")}</span>
          <h1>{selectedChild.name}</h1>
          <p>{t("report.subtitle")}</p>
        </div>
      </div>
      <HomeworkReportView report={report.data} />
    </div>
  );
}

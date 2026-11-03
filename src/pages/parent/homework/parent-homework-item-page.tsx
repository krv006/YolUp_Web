import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { HomeworkDetail } from "./homework-detail";
import { useHomeworkView } from "./use-homework-view";

export function ParentHomeworkItemPage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { assignmentId = "" } = useParams();
  const compact = useIsCompact();
  const view = useHomeworkView();
  if (!compact) return <Navigate to={ROUTES.parent.homework} replace />;
  const assignment = view.assignments.find((item) => item.id === assignmentId) ?? null;
  if (!view.loading && !assignment) return <Navigate to={ROUTES.parent.homework} replace />;

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("mobile.homework.title")} backLabel={t("homeworkView.title")} onBack={() => navigate(ROUTES.parent.homework)} />
      {assignment ? (
        <HomeworkDetail
          assignment={assignment}
          assignments={view.assignments}
          course={view.courseById.get(assignment.courseId)}
          childId={view.child?.id ?? null}
          childName={view.child?.name ?? ""}
          now={view.now}
        />
      ) : (
        <span className="h-[420px] animate-pulse rounded-[24px] bg-surface" aria-hidden="true" />
      )}
    </div>
  );
}

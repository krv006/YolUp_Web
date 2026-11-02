import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { HomeworkFilter } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import { MobileEmptyCard, MobileTitleHeader } from "@/shared/ui/mobile-page";
import { ParentErrorBanner } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { HomeworkList } from "./homework-list";
import { useHomeworkView } from "./use-homework-view";

export function HomeworkMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const [filter, setFilter] = useState<HomeworkFilter>("all");

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <MobileTitleHeader eyebrow={t("homeworkView.eyebrow")} title={t("homeworkView.title")} />
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}
      {view.loading ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <span className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((item) => (
              <span key={item} className="h-15 rounded-2xl bg-surface" />
            ))}
          </span>
          <span className="h-[150px] animate-pulse rounded-[20px] bg-surface" />
          <span className="h-[150px] animate-pulse rounded-[20px] bg-surface" />
        </div>
      ) : !view.child ? (
        <MobileConnect />
      ) : !view.assignments.length ? (
        <MobileEmptyCard icon="assignment" title={t("homeworkView.empty.title")} description={t("homeworkView.empty.text")} />
      ) : (
        <HomeworkList
          assignments={view.assignments}
          now={view.now}
          filter={filter}
          selectedId={null}
          onFilter={setFilter}
          onSelect={(id) => navigate(ROUTES.parent.homeworkItem(id))}
        />
      )}
    </div>
  );
}

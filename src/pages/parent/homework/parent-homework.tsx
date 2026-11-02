import { useState } from "react";
import { useTranslation } from "react-i18next";
import { parentHomework, type HomeworkFilter } from "@/modules/parent";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { ConnectChild } from "../dashboard/home-empty";
import { HomeworkDetail } from "./homework-detail";
import { HomeworkList } from "./homework-list";
import { useHomeworkView } from "./use-homework-view";

function HomeworkSkeleton() {
  return (
    <div className="grid grid-cols-[400px_minmax(0,1fr)] gap-5 xl:grid-cols-[420px_minmax(0,1fr)]" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-15 rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-10 w-24 rounded-full bg-skeleton" />
          ))}
        </div>
        {[0, 1].map((block) => (
          <div key={block} className="flex flex-col gap-4 rounded-[20px] bg-surface p-4">
            {[0, 1].map((item) => (
              <span key={item} className="flex items-center gap-3">
                <span className="size-11 rounded-xl bg-skeleton" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-3.5 w-2/3 rounded-full bg-skeleton" />
                  <span className="h-3 w-1/3 rounded-full bg-skeleton" />
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="flex min-h-[560px] flex-col gap-4 rounded-[24px] bg-surface p-6">
        <span className="h-6 w-48 rounded-full bg-skeleton" />
        <span className="h-8 w-2/3 rounded-full bg-skeleton" />
        <span className="h-4 w-56 rounded-full bg-skeleton" />
        <span className="h-24 rounded-2xl bg-skeleton" />
        <span className="h-3.5 w-4/5 rounded-full bg-skeleton" />
        <span className="h-3.5 w-3/5 rounded-full bg-skeleton" />
      </div>
    </div>
  );
}

export function ParentHomework() {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const [filter, setFilter] = useState<HomeworkFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const childName = view.child?.name ?? "";
  const { waiting, submitted } = parentHomework.splitHomework(view.assignments, filter, view.now);
  const ordered = [...waiting, ...submitted];
  const selected = ordered.find((item) => item.id === selectedId) ?? ordered[0] ?? null;

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={childName ? `${t("homeworkView.eyebrow")} · ${childName}` : t("homeworkView.eyebrow")}
        title={t("homeworkView.title")}
      />

      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}

      {view.loading ? (
        <HomeworkSkeleton />
      ) : !view.child ? (
        <ConnectChild />
      ) : !view.assignments.length ? (
        <section className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="assignment" size={30} />
          </span>
          <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("homeworkView.empty.title")}</strong>
          <p className="max-w-[300px] text-body-sm text-ink-secondary">{t("homeworkView.empty.text")}</p>
        </section>
      ) : (
        <div className="grid grid-cols-[400px_minmax(0,1fr)] items-start gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <HomeworkList
            assignments={view.assignments}
            now={view.now}
            filter={filter}
            selectedId={selected?.id ?? null}
            onFilter={setFilter}
            onSelect={setSelectedId}
          />
          {selected ? (
            <HomeworkDetail
              key={selected.id}
              assignment={selected}
              assignments={view.assignments}
              course={view.courseById.get(selected.courseId)}
              childName={childName}
              now={view.now}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

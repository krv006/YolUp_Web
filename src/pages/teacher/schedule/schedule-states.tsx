import { useTranslation } from "react-i18next";
import { MobileEmptyCard } from "@/shared/ui/mobile-page";

const BAR = "rounded-full bg-skeleton";

export function MobileScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="flex h-[72px] flex-col gap-3 overflow-hidden rounded-xl bg-surface px-4 pt-4">
          <i className={`${BAR} h-3.5 w-[143px] shrink-0`} />
          <i className={`${BAR} h-3 w-[250px] max-w-full shrink-0`} />
          <i className={`${BAR} h-3 w-[195px] shrink-0`} />
        </span>
      ))}
    </div>
  );
}

export function ScheduleListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-7 rounded-2xl bg-surface px-4 py-3.5" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="flex h-10 shrink-0 items-start gap-3">
          <i className="size-10 shrink-0 rounded-lg bg-skeleton" />
          <span className="flex min-w-0 flex-1 flex-col gap-2 pt-[5px]">
            <i className={`${BAR} h-3 w-[508px] max-w-full`} />
            <i className={`${BAR} h-2.5 w-[338px] max-w-full`} />
          </span>
        </span>
      ))}
    </div>
  );
}

export function ScheduleError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("lesson");
  return (
    <MobileEmptyCard
      icon="warning-fill"
      title={t("scheduleState.errorTitle")}
      description={t("scheduleState.errorHint")}
      action={{ label: t("scheduleState.retry"), icon: "refresh", onClick: onRetry }}
    />
  );
}

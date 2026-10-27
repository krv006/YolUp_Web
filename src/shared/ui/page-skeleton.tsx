import { RowSkeleton } from "./row-skeleton";

const BAR = "rounded-full bg-skeleton";

export function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:gap-[18px]" aria-hidden="true">
      <span className="flex h-30 flex-col gap-3 rounded-xl bg-surface p-4 lg:h-24">
        <i className={`${BAR} h-3.5 w-[143px] lg:w-64`} />
        <i className={`${BAR} h-3 w-[251px] max-w-full lg:w-[448px]`} />
        <i className={`${BAR} h-3 w-[197px] max-w-full lg:w-[352px]`} />
      </span>
      <span className="flex flex-col gap-7 rounded-xl bg-surface px-4 py-3.5">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={`items-center gap-3 ${index === 4 ? "flex lg:hidden" : "flex"}`}>
            <i className="size-10 shrink-0 rounded-md bg-skeleton" />
            <span className="flex flex-col gap-2">
              <i className={`${BAR} h-3 w-[161px] lg:w-[288px]`} />
              <i className={`${BAR} h-2.5 w-[106px] lg:w-48`} />
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="flex h-full min-h-0 flex-col gap-5.5 overflow-hidden bg-canvas bg-auth-gradient px-4 pt-5.5 lg:gap-5 lg:bg-page-gradient lg:px-8 lg:py-7">
      <span className="flex items-center gap-4" aria-hidden="true">
        <span className="flex min-w-0 flex-1 flex-col gap-3 py-1">
          <i className={`${BAR} h-3 w-28 lg:w-48`} />
          <i className={`${BAR} h-6 w-36 lg:h-7 lg:w-44`} />
        </span>
        <i className="hidden h-10 w-80 rounded-full bg-surface lg:block" />
        <i className="hidden size-10 rounded-full bg-surface lg:block" />
      </span>
      <div className="lg:max-w-[640px]">
        <CardsSkeleton />
      </div>
    </main>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col justify-end gap-[38px] overflow-hidden px-4 pb-7 lg:px-11" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}

import { useLocation } from "react-router-dom";
import { PageSkeleton } from "@/shared/ui/page-skeleton";

const SHELL = /^\/(teacher|student|parent|admin)(\/|$)/;
const BAR = "rounded-full bg-skeleton";

export function BootSkeleton() {
  const { pathname } = useLocation();

  if (!SHELL.test(pathname))
    return <div className="min-h-dvh w-full bg-canvas bg-auth-gradient" role="status" aria-busy="true" />;

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body" role="status" aria-busy="true">
      <aside className="hidden h-full w-(--layout-sidebar) shrink-0 flex-col gap-6 border-r border-line-subtle bg-surface px-4 pt-6 pb-5 lg:flex">
        <span className="flex h-8 items-center gap-2 px-3">
          <i className="size-8 rounded-lg bg-skeleton" />
          <i className={`${BAR} h-4 w-20`} />
        </span>
        <span className="-mt-0.5 flex flex-col gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="flex h-11 items-center gap-3 px-3">
              <i className="size-5 rounded-md bg-skeleton" />
              <i className={`${BAR} h-3 ${index % 2 ? "w-24" : "w-20"}`} />
            </span>
          ))}
        </span>
        <span className="mt-auto flex h-14 items-center gap-3 rounded-2xl bg-subtle px-3">
          <i className="size-9 rounded-full bg-skeleton" />
          <span className="flex flex-col gap-2">
            <i className={`${BAR} h-3 w-24`} />
            <i className={`${BAR} h-2.5 w-16`} />
          </span>
        </span>
      </aside>
      <div className="min-w-0 flex-1 overflow-hidden pb-28 lg:pb-0">
        <PageSkeleton />
      </div>
      <span className="fixed inset-x-4 bottom-[max(30px,env(safe-area-inset-bottom))] flex h-17 items-center justify-around rounded-[28px] bg-surface px-2 shadow-lg lg:hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} className={index === 2 ? "size-14 rounded-full bg-skeleton" : "h-8 w-12 rounded-full bg-skeleton"} />
        ))}
      </span>
    </div>
  );
}

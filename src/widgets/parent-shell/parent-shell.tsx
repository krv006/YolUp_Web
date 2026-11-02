import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { useSelectedChild } from "@/modules/parent";
import { useOnlineStatus } from "@/shared/model";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { ParentSidebar } from "./parent-sidebar";
import { ParentOffline, ParentUnlinked } from "./parent-states";

export function ParentShell() {
  const online = useOnlineStatus();
  const { childrenQuery } = useSelectedChild();
  const nothingLoaded = !online && !childrenQuery.data;

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <ParentSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-page-gradient dark:bg-auth-gradient">
        {nothingLoaded ? (
          <ParentOffline onRetry={() => void childrenQuery.refetch()} />
        ) : (
          <ParentUnlinked>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ParentUnlinked>
        )}
      </main>
    </div>
  );
}

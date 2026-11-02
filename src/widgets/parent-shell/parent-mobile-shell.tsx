import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { ParentOffline, ParentUnlinked } from "./parent-states";
import { ParentTabBar } from "./parent-tab-bar";

const TAB_ROOTS: string[] = [
  ROUTES.parent.dashboard,
  ROUTES.parent.children,
  ROUTES.parent.attendance,
  ROUTES.parent.homework,
  ROUTES.parent.grades,
  ROUTES.parent.exams,
];

export function ParentMobileShell() {
  const { pathname } = useLocation();
  const online = useOnlineStatus();
  const { childrenQuery } = useSelectedChild();
  const withTabs = TAB_ROOTS.includes(pathname.replace(/\/$/, ""));

  return (
    <div className="relative h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <main className={`h-full overflow-y-auto bg-auth-gradient ${withTabs ? "pb-32" : ""}`}>
        {!online && !childrenQuery.data ? (
          <ParentOffline onRetry={() => void childrenQuery.refetch()} />
        ) : (
          <ParentUnlinked>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ParentUnlinked>
        )}
      </main>
      {withTabs ? <ParentTabBar /> : null}
    </div>
  );
}

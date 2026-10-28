import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { StudentEnrollmentDialog } from "@/modules/student";
import { PageSkeleton } from "@/shared/ui/page-skeleton";
import { AppSidebar } from "@/widgets/app-sidebar";
import { MobileTabBar } from "@/widgets/mobile-tab-bar";

export function AppShellLayout() {
  const { pathname } = useLocation();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);
  const root = pathname.replace(/\/$/, "");
  const tabRoots: string[] = [routes.dashboard, routes.schedule, routes.workspace, routes.profile];
  const withTabs = tabRoots.includes(root);
  const overlaysTabs = root !== routes.schedule && withTabs;

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <div className="hidden lg:contents">
        <AppSidebar />
      </div>
      <div
        className={`min-w-0 flex-1 overflow-hidden lg:pb-0 ${withTabs && !overlaysTabs ? "pb-28" : ""}`}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>

      {withTabs ? <MobileTabBar /> : null}

      {isStudent ? (
        <StudentEnrollmentDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      ) : (
        <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      )}
    </div>
  );
}

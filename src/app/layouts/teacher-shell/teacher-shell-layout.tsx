import { Outlet, useLocation } from "react-router-dom";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { AppSidebar } from "@/widgets/app-sidebar";
import { MobileTabBar } from "@/widgets/mobile-tab-bar";

const TAB_ROOTS: string[] = [
  ROUTES.teacher.dashboard,
  ROUTES.teacher.schedule,
  ROUTES.teacher.workspace,
  ROUTES.teacher.profile,
];

export function TeacherShellLayout() {
  const { pathname } = useLocation();
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);
  const withTabs = TAB_ROOTS.includes(pathname.replace(/\/$/, ""));
  const overlaysTabs = pathname.startsWith(ROUTES.teacher.dashboard);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <div className="hidden lg:contents">
        <AppSidebar />
      </div>
      <div
        className={`min-w-0 flex-1 overflow-hidden lg:pb-0 ${withTabs && !overlaysTabs ? "pb-28" : ""}`}
      >
        <Outlet />
      </div>

      {withTabs ? <MobileTabBar /> : null}

      <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
    </div>
  );
}

import { Outlet } from "react-router-dom";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { AppSidebar } from "@/widgets/app-sidebar";

export function TeacherShellLayout() {
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>

      <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
    </div>
  );
}

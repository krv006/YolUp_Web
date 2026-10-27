import { useLocation } from "react-router-dom";
import { ConversationLayout } from "@/app/layouts/conversation-layout";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChatShellLayout, MobileConversationList } from "@/widgets/chat-shell";
import { MobileTabBar } from "@/widgets/mobile-tab-bar";

export function TeacherLayout() {
  const isCompact = useIsCompact();
  const { pathname } = useLocation();
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);

  if (!isCompact) return <ChatShellLayout />;

  if (pathname.replace(/\/$/, "") === ROUTES.teacher.chats)
    return (
      <div className="h-dvh min-h-0 overflow-hidden bg-canvas">
        <MobileConversationList />
        <MobileTabBar />
        <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      </div>
    );

  return <ConversationLayout role="teacher" />;
}

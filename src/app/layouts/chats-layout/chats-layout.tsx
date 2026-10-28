import { useLocation } from "react-router-dom";
import { ConversationLayout } from "@/app/layouts/conversation-layout";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { StudentEnrollmentDialog } from "@/modules/student";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ConversationRole } from "@/shared/types";
import { ChatShellLayout, MobileConversationList } from "@/widgets/chat-shell";
import { MobileTabBar } from "@/widgets/mobile-tab-bar";

export function ChatsLayout({ role }: { role: ConversationRole }) {
  const isCompact = useIsCompact();
  const { pathname } = useLocation();
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);
  const chatsRoot = role === "student" ? ROUTES.student.chats : ROUTES.teacher.chats;

  if (!isCompact) return <ChatShellLayout />;

  if (pathname.replace(/\/$/, "") === chatsRoot)
    return (
      <div className="h-dvh min-h-0 overflow-hidden bg-canvas">
        <MobileConversationList />
        <MobileTabBar />
        {role === "student" ? (
          <StudentEnrollmentDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
        ) : (
          <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
        )}
      </div>
    );

  return <ConversationLayout role={role} />;
}

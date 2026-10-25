import { ConversationLayout } from "@/app/layouts/conversation-layout";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { ChatShellLayout } from "@/widgets/chat-shell";

export function TeacherLayout() {
  const isCompact = useIsCompact();
  return isCompact ? <ConversationLayout role="teacher" /> : <ChatShellLayout />;
}

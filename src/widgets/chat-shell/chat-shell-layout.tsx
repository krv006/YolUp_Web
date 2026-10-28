import { Suspense } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsStudent } from "@/modules/auth";
import { NewConversationDialog, useNewConversationStore } from "@/modules/conversation";
import { StudentEnrollmentDialog } from "@/modules/student";
import { ChatSkeleton } from "@/shared/ui/page-skeleton";
import { ConversationTopbar } from "@/widgets/conversation-topbar";
import { AppSidebar } from "@/widgets/app-sidebar";
import { ConversationListPanel } from "./conversation-list-panel";

function sectionFromPath(pathname: string) {
  if (pathname.endsWith("/schedule")) return "schedule" as const;
  if (pathname.includes("/profile")) return "profile" as const;
  if (
    pathname.endsWith("/workspace") ||
    pathname.endsWith("/search") ||
    pathname.endsWith("/notifications") ||
    pathname.endsWith("/quizzes") ||
    pathname.endsWith("/assignments") ||
    pathname.endsWith("/ai") ||
    pathname.endsWith("/analytics") ||
    pathname.includes("/exams") ||
    pathname.includes("/homework-board")
  )
    return "workspace" as const;
  return "chat" as const;
}

export function ChatShellLayout() {
  const { t } = useTranslation("nav");
  const { pathname } = useLocation();
  const { conversationId } = useParams();
  const section = sectionFromPath(pathname);
  const isStudent = useIsStudent();
  const newGroupOpen = useNewConversationStore((state) => state.open);
  const setNewGroupOpen = useNewConversationStore((state) => state.setOpen);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas font-body text-ink">
      <AppSidebar />

      {section === "chat" ? <ConversationListPanel /> : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {section === "chat" || section === "profile" ? null : (
          <ConversationTopbar
            role={isStudent ? "student" : "teacher"}
            section={section}
            title={
              pathname.endsWith("/assignments") ? t("titles.assignments") : t(`titles.${section}`)
            }
          />
        )}
        <main className="min-h-0 flex-1 overflow-hidden bg-canvas">
          <Suspense fallback={<ChatSkeleton />}>
            <Outlet key={conversationId ?? section} />
          </Suspense>
        </main>
      </div>

      {isStudent ? (
        <StudentEnrollmentDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      ) : (
        <NewConversationDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} />
      )}
    </div>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { NotificationBell, type NotificationLink } from "@/modules/notification";
import type { ConversationRole } from "@/shared/types";

export interface ConversationTopbarProps {
  role: ConversationRole;
  title: string;
}

export function ConversationTopbar({ role, title }: ConversationTopbarProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data = [] } = useConversations(role);
  const basePath = role === "teacher" ? "/teacher/chats" : "/student/chats";

  async function openNotificationLink(link: NotificationLink) {
    if (link.type === "assignment") {
      try {
        const assignment = await queryClient.fetchQuery({
          queryKey: homeworkKeys.assignment(link.id),
          queryFn: ({ signal }) => homeworkApi.getAssignment(link.id, { signal }),
        });
        const room = data.find((item) => item.courseId === assignment.courseId);
        if (!room) {
          toast.error(t("panel.assignmentGroupNotFound"));
          return;
        }
        navigate(`${basePath}/${room.id}?tab=assignments&assignment=${link.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("panel.assignmentOpenFailed"));
      }
      return;
    }
    if (link.type === "submission") {
      try {
        const submission = await queryClient.fetchQuery({
          queryKey: homeworkKeys.submission(link.id),
          queryFn: ({ signal }) => homeworkApi.getSubmission(link.id, { signal }),
        });
        if (!submission) {
          toast.error(t("panel.assignmentOpenFailed"));
          return;
        }
        const assignment = await queryClient.fetchQuery({
          queryKey: homeworkKeys.assignment(submission.assignmentId),
          queryFn: ({ signal }) => homeworkApi.getAssignment(submission.assignmentId, { signal }),
        });
        const room = data.find((item) => item.courseId === assignment.courseId);
        if (!room) {
          toast.error(t("panel.assignmentGroupNotFound"));
          return;
        }
        navigate(
          `${basePath}/${room.id}?tab=assignments&assignment=${submission.assignmentId}&submission=${link.id}`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("panel.assignmentOpenFailed"));
      }
      return;
    }
    if (link.type === "quiz") {
      navigate(`${basePath}/quizzes?quiz=${link.id}`);
      return;
    }
    if (link.type === "exam") {
      navigate(`${basePath}/exams/${link.id}`);
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-5 lg:h-(--layout-topbar) lg:gap-4 lg:px-8">
      <h1 className="min-w-0 flex-1 truncate font-heading text-h2 text-ink">{title}</h1>

      <NotificationBell
        enabled={Boolean(user)}
        className="relative grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
        onOpenLink={openNotificationLink}
      />
    </header>
  );
}

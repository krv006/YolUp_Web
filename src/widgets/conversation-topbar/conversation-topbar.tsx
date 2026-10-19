import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import logoUrl from "@/shared/assets/y-logo.svg";
import { useAuth } from "@/modules/auth";
import { useNewConversationStore } from "@/modules/conversation";
import { Icon } from "@/shared/ui/icon";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { NotificationBell, type NotificationLink } from "@/modules/notification";
import type { ConversationRole } from "@/shared/types";

export interface ConversationTopbarProps {
  role: ConversationRole;
  title: string;
  section?: "chat" | "schedule" | "workspace" | "profile";
}

export function ConversationTopbar({ role, title, section = "chat" }: ConversationTopbarProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data = [] } = useConversations(role);
  const openNewGroup = useNewConversationStore((state) => state.setOpen);
  const workspace = section === "workspace";
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
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas px-5 lg:h-(--layout-topbar) lg:gap-4 lg:border-line lg:bg-surface lg:px-8">
      {section === "chat" ? (
        <img className="size-8 shrink-0 lg:hidden" src={logoUrl} alt="YolUp" />
      ) : null}
      <h1
        className={`min-w-0 flex-1 truncate font-heading text-h2 text-ink ${
          section === "chat" ? "hidden lg:block" : ""
        }`}
      >
        {title}
      </h1>
      {section === "chat" ? <span className="flex-1 lg:hidden" /> : null}

      {workspace ? (
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle lg:hidden"
          onClick={() => navigate("search")}
          aria-label={t("workspace:searchAria")}
        >
          <Icon name="search" size={19} />
        </button>
      ) : null}

      {workspace && role === "teacher" ? (
        <button
          type="button"
          className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover lg:flex"
          onClick={() => openNewGroup(true)}
        >
          <Icon name="add" size={18} /> {t("workspace:createGroup")}
        </button>
      ) : null}

      <NotificationBell
        enabled={Boolean(user)}
        pageHref={`${basePath}/notifications`}
        className="relative grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
        onOpenLink={openNotificationLink}
      />
    </header>
  );
}

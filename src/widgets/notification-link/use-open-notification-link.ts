import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import type { OpenNotificationLink } from "@/modules/notification";
import { ROUTES } from "@/shared/config";

const RESULT_KINDS = ["result", "graded", "grade", "attempt", "finished"];

function isResult(kind?: string | null): boolean {
  return Boolean(kind) && RESULT_KINDS.some((part) => kind!.includes(part));
}

export function useOpenNotificationLink(): OpenNotificationLink {
  const { t } = useTranslation("notification");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const student = useIsStudent();
  const routes = useRoleRoutes();
  const conversations = useConversations(student ? "student" : "teacher");

  return useCallback(
    (link, kind) => {
      const fail = (error: unknown) => toast.error(error instanceof Error ? error.message : t("openFailed"));
      const type = link.type.toLowerCase();

      if (type === "lesson") {
        navigate(kind?.includes("recording") ? routes.recording(link.id) : ROUTES.live(link.id));
        return;
      }
      if (type === "recording") {
        navigate(routes.recording(link.id));
        return;
      }
      if (type === "assignment" || type === "homework") {
        navigate(routes.homeworkItem(link.id));
        return;
      }
      if (type === "submission") {
        queryClient
          .fetchQuery({
            queryKey: homeworkKeys.submission(link.id),
            queryFn: ({ signal }) => homeworkApi.getSubmission(link.id, { signal }),
          })
          .then((submission) => {
            if (!submission) throw new Error(t("openFailed"));
            navigate(
              student
                ? ROUTES.student.homeworkItem(submission.assignmentId)
                : `${ROUTES.teacher.homeworkReview(submission.assignmentId)}?s=${encodeURIComponent(link.id)}`
            );
          })
          .catch(fail);
        return;
      }
      if (type === "quiz" || type === "test") {
        navigate(isResult(kind) ? routes.testResults(link.id) : routes.test(link.id));
        return;
      }
      if (type === "exam" || type === "mock") {
        if (student) navigate(isResult(kind) ? ROUTES.student.mockResults(link.id) : ROUTES.student.mockExams);
        else navigate(ROUTES.teacher.mockResults(link.id));
        return;
      }
      if (type === "course") {
        const room = conversations.data?.find((item) => item.courseId === link.id);
        navigate(room ? routes.chat(room.id) : routes.chats);
        return;
      }
      if (type === "certificate") {
        navigate(`${routes.profile}/certificates`);
        return;
      }
      if (type === "support") {
        navigate(`${routes.profile}/help?ticket=${encodeURIComponent(link.id)}`);
        return;
      }
      if (type === "conversation" || type === "room" || type === "chat" || type === "chat_room" || type === "message") {
        navigate(routes.chat(link.id));
        return;
      }
      navigate(routes.notifications);
    },
    [navigate, queryClient, student, routes, conversations.data, t]
  );
}

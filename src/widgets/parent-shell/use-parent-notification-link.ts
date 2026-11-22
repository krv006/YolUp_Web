import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { OpenNotificationLink } from "@/modules/notification";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";

export function useParentNotificationLink({ replace = false }: { replace?: boolean } = {}): OpenNotificationLink {
  const navigate = useNavigate();
  const go = useCallback((to: string) => navigate(to, { replace }), [navigate, replace]);
  const { children, selectChild } = useSelectedChild();
  return useCallback(
    (link, _kind, data) => {
      const type = link.type.toLowerCase();
      const studentId = typeof data?.student_id === "string" ? data.student_id : "";
      const child = children.find((item) => item.id === studentId);
      if (child) selectChild(child.id);
      if (type === "login") go(child ? ROUTES.parent.childLogins(child.id) : ROUTES.parent.children);
      else if (["assignment", "homework", "submission"].includes(type)) go(ROUTES.parent.homework);
      else if (["lesson", "recording"].includes(type)) go(ROUTES.parent.attendance);
      else if (["quiz", "test"].includes(type)) go(ROUTES.parent.grades);
      else if (type === "course") go(ROUTES.parent.course(link.id));
      else if (["conversation", "room", "chat", "chat_room", "message"].includes(type)) go(ROUTES.parent.chat(link.id));
    },
    [children, go, selectChild]
  );
}

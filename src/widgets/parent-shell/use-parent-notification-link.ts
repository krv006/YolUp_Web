import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { OpenNotificationLink } from "@/modules/notification";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";

export function useParentNotificationLink(): OpenNotificationLink {
  const navigate = useNavigate();
  const { children, selectChild } = useSelectedChild();
  return useCallback(
    (link, _kind, data) => {
      const type = link.type.toLowerCase();
      const studentId = typeof data?.student_id === "string" ? data.student_id : "";
      const child = children.find((item) => item.id === studentId);
      if (child) selectChild(child.id);
      if (type === "login") navigate(child ? ROUTES.parent.childLogins(child.id) : ROUTES.parent.children);
      else if (["assignment", "homework", "submission"].includes(type)) navigate(ROUTES.parent.homework);
      else if (["lesson", "recording"].includes(type)) navigate(ROUTES.parent.attendance);
      else if (["exam", "mock", "quiz", "test"].includes(type)) navigate(ROUTES.parent.exams);
    },
    [children, navigate, selectChild]
  );
}

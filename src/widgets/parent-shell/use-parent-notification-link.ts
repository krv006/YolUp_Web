import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { OpenNotificationLink } from "@/modules/notification";
import { ROUTES } from "@/shared/config";

export function useParentNotificationLink(): OpenNotificationLink {
  const navigate = useNavigate();
  return useCallback(
    (link) => {
      const type = link.type.toLowerCase();
      if (["assignment", "homework", "submission"].includes(type)) navigate(ROUTES.parent.homework);
      else if (["lesson", "recording"].includes(type)) navigate(ROUTES.parent.attendance);
      else if (["exam", "mock", "quiz", "test"].includes(type)) navigate(ROUTES.parent.exams);
    },
    [navigate]
  );
}

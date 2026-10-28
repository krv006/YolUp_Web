import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import type { Assignment } from "@/shared/types";
import type { TaskRow } from "@/widgets/group-workspace";

const DAY_MS = 86_400_000;

export function useAssignmentRows() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const day = (value: string) => {
    const date = new Date(value);
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  };
  const dayTime = (value: string) => {
    const date = new Date(value);
    return `${day(value)}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (item: Assignment): TaskRow => {
    const mine = item.mySubmission;
    const left = item.dueAt ? Math.ceil((new Date(item.dueAt).getTime() - now) / DAY_MS) : null;
    const open = () => navigate(ROUTES.student.homeworkItem(item.id));
    const pill: TaskRow["pill"] = mine
      ? mine.status === "done"
        ? { tone: "success", icon: "check-circle", label: t("groupWorkspace.tasks.finished") }
        : { tone: "brand", icon: "quiz", label: t("groupWorkspace.tasks.checking") }
      : left !== null && left < 0
        ? { tone: "danger", icon: "clock", label: t("groupWorkspace.tasks.overdue") }
        : left === null
          ? { tone: "teal", icon: "clock", label: t("groupWorkspace.tasks.noDue") }
          : { tone: "teal", icon: "clock", label: t("groupWorkspace.tasks.daysLeft", { count: Math.max(left, 0) }) };
    const skill = item.skillKey ? t(`group:dialogs.assignment.skillOptions.${item.skillKey}`) : "";
    return {
      id: item.id,
      assignmentId: item.id,
      title: item.title,
      meta: [
        item.dueAt
          ? t("groupWorkspace.tasks.due", { date: mine || (left !== null && left < 0) ? day(item.dueAt) : dayTime(item.dueAt) })
          : t("groupWorkspace.tasks.noDue"),
        skill,
      ]
        .filter(Boolean)
        .join(" · "),
      pill,
      aside: mine
        ? mine.status === "done" && mine.gradeValue !== null
          ? t("groupWorkspace.tasks.grade", { value: mine.gradeValue })
          : t("groupWorkspace.tasks.submittedOn", { date: day(mine.createdAt) })
        : t("groupWorkspace.tasks.notSubmitted"),
      progress: null,
      onOpen: open,
      menu: [{ id: "open", label: t("groupWorkspace.tasks.open"), run: open }],
    };
  };
}

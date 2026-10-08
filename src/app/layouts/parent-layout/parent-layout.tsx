import { CalendarCheck2, ClipboardCheck, Home, ListChecks, Trophy, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/shared/config";
import { useAuth } from "@/modules/auth";
import { PortalLayout } from "@/app/layouts/portal-layout";
import { SelectedChildSelector } from "@/modules/parent";

export function ParentLayout() {
  const { user } = useAuth();
  const { t } = useTranslation("nav");
  const navigation = [
    { to: ROUTES.parent.dashboard, label: t("parent.dashboard"), icon: Home, end: true },
    { to: ROUTES.parent.children, label: t("parent.children"), icon: UsersRound },
    { to: ROUTES.parent.attendance, label: t("parent.attendance"), icon: CalendarCheck2 },
    { to: ROUTES.parent.homework, label: t("parent.homework"), icon: ListChecks },
    { to: ROUTES.parent.exams, label: t("parent.exams"), icon: ClipboardCheck },
    { to: ROUTES.parent.grades, label: t("parent.grades"), icon: Trophy },
  ];
  return (
    <PortalLayout
      navItems={navigation}
      roleLabel={t("roles.parent")}
      workspaceLabel={t("rail.parentWorkspace")}
      user={user}
      headerExtra={<SelectedChildSelector />}
    />
  );
}

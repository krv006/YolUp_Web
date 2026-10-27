import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { NotificationBell } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";

export function MobileTeacherHeader() {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const name = user?.name ?? "";

  return (
    <header className="flex items-center gap-2.5">
      <Avatar
        name={name}
        src={user?.avatarUrl ?? undefined}
        size="lg"
        className="shrink-0 [&_.avatar]:size-12"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="truncate text-caption text-ink-secondary">
          {user?.subject ? t("mobile.role", { subject: user.subject }) : t("mobile.roleFallback")}
        </small>
        <strong className="truncate text-title-lg text-ink">{name}</strong>
      </span>
      <NotificationBell
        pageHref={ROUTES.teacher.notifications}
        className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-subtle [&_.notification-badge]:absolute [&_.notification-badge]:top-2.5 [&_.notification-badge]:right-2.5 [&_.notification-badge]:size-2 [&_.notification-badge]:overflow-hidden [&_.notification-badge]:rounded-full [&_.notification-badge]:bg-danger [&_.notification-badge]:text-[0px] [&_.notification-badge]:ring-2 [&_.notification-badge]:ring-surface"
      />
    </header>
  );
}

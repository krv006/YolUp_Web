import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { Avatar } from "@/shared/ui/legacy";
import { ParentBell } from "./parent-bell";
import { ParentChatButton } from "./parent-chat-button";

function greeting(hour: number): "morning" | "day" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function ParentMobileHeader() {
  const { t } = useTranslation("parent");
  const { user } = useAuth();
  const [hour] = useState(() => new Date().getHours());
  return (
    <header className="flex items-center gap-3">
      <Link to={ROUTES.parent.profile} aria-label={t("shell.openAccount")} className="shrink-0">
        <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="lg" className="[&_.avatar]:size-12" />
      </Link>
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="truncate text-caption text-ink-secondary">{t(`mobile.greeting.${greeting(hour)}`)}</small>
        <strong className="truncate font-heading text-[18px]/6 font-semibold text-ink">{user?.name}</strong>
      </span>
      <ParentChatButton />
      <ParentBell />
    </header>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover";
import { ParentAccountSwitchDialog } from "./parent-account-switch-dialog";

export function ParentAccountMenu({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedChildId } = useSelectedChild();
  const [confirm, setConfirm] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const items = [
    { id: "profile", icon: "person", run: () => navigate(ROUTES.parent.settings("profile")) },
    { id: "settings", icon: "settings", run: () => navigate(ROUTES.parent.settings("notifications")) },
    ...(selectedChildId ? [{ id: "logins", icon: "history", run: () => navigate(ROUTES.parent.childLogins(selectedChildId)) }] : []),
    { id: "help", icon: "help", run: () => navigate(ROUTES.parent.help) },
    { id: "switchAccount", icon: "swap-horiz", run: () => setSwitchOpen(true) },
  ];

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>{children}</PopoverAnchor>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[260px] rounded-3xl border border-line bg-surface p-2 text-ink shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-line px-3 pt-2 pb-3">
            <Avatar name={user?.name} src={user?.avatarUrl ?? undefined} size="sm" className="shrink-0 [&_.avatar]:size-10" />
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-title-sm text-ink">{user?.name}</strong>
              <small className="truncate text-body-xs text-ink-secondary">
                {[user?.username ? `@${user.username}` : "", t("shell.role")].filter(Boolean).join(" · ")}
              </small>
            </span>
          </div>
          <div className="flex flex-col pt-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-body text-ink transition-colors hover:bg-subtle"
                onClick={() => {
                  onOpenChange(false);
                  item.run();
                }}
              >
                <Icon name={item.icon} size={20} className="text-icon" />
                {t(`account.${item.id}`)}
              </button>
            ))}
            <button
              type="button"
              className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-body text-error-text transition-colors hover:bg-danger-bg"
              onClick={() => {
                onOpenChange(false);
                setConfirm(true);
              }}
            >
              <Icon name="logout" size={20} />
              {t("account.logout")}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <ParentAccountSwitchDialog open={switchOpen} onOpenChange={setSwitchOpen} />
      <ConfirmDialog
        alert
        open={confirm}
        onOpenChange={setConfirm}
        icon="logout"
        title={t("account.logoutTitle")}
        description={t("account.logoutText")}
        confirmLabel={t("account.logoutConfirm")}
        cancelLabel={t("account.cancel")}
        onConfirm={() => {
          setConfirm(false);
          void logout().then(() => navigate(ROUTES.auth.login, { replace: true }));
        }}
      />
    </>
  );
}

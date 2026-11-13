import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LinkAccountDialog, useAccountSwitch } from "@/modules/auth";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

const ROLE_ICON: Record<string, string> = { teacher: "school", student: "person", parent: "groups" };

export interface ParentAccountSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParentAccountSwitchDialog({ open, onOpenChange }: ParentAccountSwitchDialogProps) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const accounts = useAccountSwitch();
  const roleLabel = (role?: string) => tn(`roles.${role?.toLowerCase() ?? "parent"}`, { defaultValue: role ?? "" });
  const close = () => onOpenChange(false);
  const row =
    "flex min-h-16 w-full items-center gap-3 rounded-xl bg-subtle px-3.5 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60";

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        variant="adaptive"
        width="lg:max-w-110"
        title={t("page.switchAccount")}
        description={t("page.switchAccountDescription")}
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <span className="flex min-h-16 items-center gap-3 rounded-xl border-[1.5px] border-brand bg-brand-subtle px-3.5 py-2.5">
            <Avatar name={accounts.user?.name} src={accounts.user?.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-11" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">{accounts.user?.name}</strong>
              <small className="truncate text-body-xs text-ink-secondary">{roleLabel(accounts.user?.role)}</small>
            </span>
            <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 text-caption-strong text-success-fg">
              <Icon name="check-circle" size={14} className="text-success" /> {t("page.accountActive")}
            </span>
          </span>

          {accounts.linkedAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              className={row}
              disabled={accounts.pending}
              onClick={() => accounts.toAccount(account.id, close)}
            >
              <Avatar name={account.name || account.username} size="sm" className="[&_.avatar]:size-11" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{account.name || account.username}</strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {roleLabel(account.role)} · @{account.username}
                </small>
              </span>
              {accounts.pendingAccountId === account.id ? (
                <Loader2 size={18} className="shrink-0 animate-spin text-brand" />
              ) : (
                <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
              )}
            </button>
          ))}

          {accounts.missingRoles.length ? (
            <>
              <small className="mt-2 px-1 text-caption-strong text-ink-tertiary uppercase">{t("roleSwitcher.openRoles")}</small>
              {accounts.missingRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={row}
                  disabled={accounts.pending}
                  onClick={() => accounts.toRole(role, close)}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand">
                    <Icon name={ROLE_ICON[role.toLowerCase()] ?? "person"} size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-title-sm text-ink">{roleLabel(role)}</strong>
                    <small className={`text-body-xs ${accounts.needsPhone ? "text-warning-fg" : "truncate text-ink-secondary"}`}>
                      {accounts.needsPhone ? t("roleSwitcher.needsPhone") : t("roleSwitcher.openHint")}
                    </small>
                  </span>
                  {accounts.pendingRole === role.toLowerCase() ? (
                    <Loader2 size={18} className="shrink-0 animate-spin text-brand" />
                  ) : (
                    <Icon
                      name={accounts.needsPhone ? "chevron-right" : "add"}
                      size={20}
                      className={`shrink-0 ${accounts.needsPhone ? "text-icon-tertiary" : "text-brand"}`}
                    />
                  )}
                </button>
              ))}
            </>
          ) : null}

          <button type="button" className={`${row} mt-1`} disabled={accounts.pending} onClick={accounts.openLink}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand">
              <Icon name="link" size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">{t("roleSwitcher.link.row")}</strong>
              <small className="truncate text-body-xs text-ink-secondary">{t("roleSwitcher.link.rowHint")}</small>
            </span>
            <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
          </button>

          <p className="px-1 pt-1 text-body-xs text-ink-tertiary">{t("roleSwitcher.switchHint")}</p>
        </div>
      </AppDialog>
      <LinkAccountDialog prompt={accounts.linkPrompt} onClose={accounts.closeLink} onLinked={accounts.afterLink} />
    </>
  );
}

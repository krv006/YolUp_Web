import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccountSwitch, useAuth } from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

const ROLE_ICON: Record<string, string> = { teacher: "school", parent: "groups", student: "person" };

export function SwitchAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const accounts = useAccountSwitch();
  const isCompact = useIsCompact();
  const user = accounts.user;
  const close = () => onOpenChange(false);
  const roleLabel = (role?: string) => tn(`roles.${role?.toLowerCase() ?? "student"}`, { defaultValue: role ?? "" });
  const row = isCompact
    ? "flex min-h-[68px] items-center gap-3 rounded-lg bg-subtle px-3.5 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
    : "flex items-center gap-3 rounded-md bg-subtle px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60";
  const titleClass = isCompact ? "truncate text-title text-ink" : "truncate text-title-sm text-ink";
  const hintClass = isCompact ? "truncate text-body-sm text-ink-secondary" : "truncate text-body-xs text-ink-secondary";
  const openHintClass = `${isCompact ? "text-body-sm" : "text-body-xs"} ${accounts.needsPhone ? "text-warning-fg" : "text-ink-secondary"}`;
  const avatarClass = isCompact ? "[&_.avatar]:size-11" : undefined;

  const list = (
    <>
      {accounts.linkedAccounts.map((account) => (
        <button
          key={account.id}
          type="button"
          className={row}
          disabled={accounts.pending}
          onClick={() => accounts.toAccount(account.id, close)}
        >
          <Avatar name={account.name || account.username} size="sm" className={avatarClass} />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className={titleClass}>{account.name || account.username}</strong>
            <small className={hintClass}>{roleLabel(account.role)}</small>
          </span>
          {accounts.pendingAccountId === account.id ? (
            <Loader2 size={18} className="shrink-0 animate-spin text-brand" />
          ) : (
            <Icon name="chevron-right" size={isCompact ? 20 : 18} className="shrink-0 text-icon-tertiary" />
          )}
        </button>
      ))}

      {accounts.missingRoles.length ? (
        <small className="mt-1.5 px-1 text-caption-strong text-ink-tertiary uppercase">{t("roleSwitcher.openRoles")}</small>
      ) : null}
      {accounts.missingRoles.map((role) => (
        <button
          key={role}
          type="button"
          className={row}
          disabled={accounts.pending}
          onClick={() => accounts.toRole(role, close)}
        >
          <span className={`grid shrink-0 place-items-center rounded-full bg-surface text-brand ${isCompact ? "size-11" : "size-10"}`}>
            <Icon name={ROLE_ICON[role.toLowerCase()] ?? "person"} size={isCompact ? 22 : 20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className={titleClass}>{roleLabel(role)}</strong>
            <small className={openHintClass}>
              {accounts.needsPhone ? t("roleSwitcher.needsPhone") : t("roleSwitcher.openHint")}
            </small>
          </span>
          {accounts.pendingRole === role.toLowerCase() ? (
            <Loader2 size={18} className="shrink-0 animate-spin text-brand" />
          ) : (
            <Icon
              name={accounts.needsPhone ? "chevron-right" : "add"}
              size={isCompact ? 20 : 18}
              className={`shrink-0 ${accounts.needsPhone ? "text-icon-tertiary" : "text-brand"}`}
            />
          )}
        </button>
      ))}
    </>
  );

  if (isCompact)
    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        variant="adaptive"
        title={t("page.switchAccount")}
        description={t("page.switchAccountHint")}
        footer={<span aria-hidden="true" />}
        footerClassName="pb-[43px]"
      >
        <div className="-mt-0.5 flex flex-col gap-[11px]">
          <span className="flex h-[70px] items-center gap-3 rounded-lg border-[1.5px] border-brand bg-brand-subtle px-3.5">
            <Avatar name={user?.name} size="sm" src={user?.avatarUrl} className="[&_.avatar]:size-11" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">{user?.name}</strong>
              <small className="truncate text-body-sm text-ink-secondary">{roleLabel(user?.role)}</small>
            </span>
            <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 text-caption-strong text-success-fg">
              <Icon name="check-circle" size={14} className="text-success" /> {t("page.accountActive")}
            </span>
          </span>
          {list}
        </div>
      </AppDialog>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-120"
      title={t("page.switchAccount")}
      description={t("page.switchAccountHint")}
    >
      <div className="flex flex-col gap-2.5 pb-3">
        <span className="flex items-center gap-3 rounded-md border-2 border-brand bg-brand-subtle px-3 py-2.5">
          <Avatar name={user?.name} size="sm" src={user?.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm text-ink">{user?.name}</strong>
            <small className="truncate text-body-xs text-ink-secondary">{roleLabel(user?.role)}</small>
          </span>
          <small className="flex shrink-0 items-center gap-1 text-body-xs text-success">
            <Icon name="check-circle" size={15} /> {t("page.accountActive")}
          </small>
        </span>
        {list}
      </div>
    </AppDialog>
  );
}

export function LogoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("account");
  const { logout } = useAuth();
  const isCompact = useIsCompact();

  if (isCompact)
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        tone="brand"
        icon="logout"
        title={t("page.logoutTitle")}
        description={t("page.logoutDescription")}
        confirmLabel={t("page.logout")}
        cancelLabel={t("page.cancel")}
        onConfirm={() => {
          onOpenChange(false);
          void logout();
        }}
      />
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      layout="centered"
      width="lg:w-82"
      icon={
        <span className="grid size-14 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="logout" size={24} />
        </span>
      }
      title={t("page.logoutTitle")}
      description={t("page.logoutDescription")}
      footer={
        <>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
            onClick={() => {
              onOpenChange(false);
              void logout();
            }}
          >
            {t("page.logout")}
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-full text-button text-brand transition-colors hover:bg-brand-subtle"
            onClick={() => onOpenChange(false)}
          >
            {t("page.cancel")}
          </button>
        </>
      }
    />
  );
}

export function DeleteAccountDialog({
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("account");
  const isCompact = useIsCompact();

  if (isCompact)
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        icon="logout"
        title={t("page.deleteAccountTitle")}
        description={t("page.deleteAccountDescription")}
        confirmLabel={t("page.delete")}
        cancelLabel={t("page.cancel")}
        pending={pending}
        onConfirm={onConfirm}
      />
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      layout="centered"
      width="lg:w-82"
      icon={
        <span className="grid size-14 place-items-center rounded-full bg-danger-bg text-danger">
          <Icon name="logout" size={24} />
        </span>
      }
      title={t("page.deleteAccountTitle")}
      description={t("page.deleteAccountDescription")}
      footer={
        <>
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full bg-danger-bg px-5 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
            disabled={pending}
            onClick={onConfirm}
          >
            {t("page.delete")}
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-full text-button text-brand transition-colors hover:bg-brand-subtle"
            onClick={() => onOpenChange(false)}
          >
            {t("page.cancel")}
          </button>
        </>
      }
    />
  );
}

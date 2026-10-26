import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useSwitchAccountMutation } from "@/modules/auth";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export function SwitchAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const navigate = useNavigate();
  const { user } = useAuth();
  const switchAccount = useSwitchAccountMutation();
  const linkedAccounts = user?.linkedAccounts ?? [];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-120"
      title={t("page.switchAccount")}
      description={t("page.switchAccountHint")}
    >
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center gap-3 rounded-md border-2 border-brand bg-brand-subtle px-3 py-2.5">
          <Avatar name={user?.name} size="sm" src={user?.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-title-sm text-ink">{user?.name}</strong>
            <small className="truncate text-body-xs text-ink-secondary">
              {tn(`roles.${user?.role?.toLowerCase() ?? "teacher"}`, {
                defaultValue: user?.role ?? "",
              })}
            </small>
          </span>
          <small className="flex shrink-0 items-center gap-1 text-body-xs text-success">
            <Icon name="check-circle" size={15} /> {t("page.accountActive")}
          </small>
        </span>

        {linkedAccounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className="flex items-center gap-3 rounded-md bg-subtle px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
            disabled={switchAccount.isPending}
            onClick={() =>
              switchAccount.mutate(account.id, {
                onSuccess: () => onOpenChange(false),
                onError: (error: Error) => toast.error(error.message),
              })
            }
          >
            <Avatar name={account.name || account.username} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">
                {account.name || account.username}
              </strong>
              <small className="truncate text-body-xs text-ink-secondary">
                {tn(`roles.${account.role?.toLowerCase() ?? "student"}`, {
                  defaultValue: account.role,
                })}
              </small>
            </span>
            <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
          </button>
        ))}

        <button
          type="button"
          className="flex h-11 items-center justify-center gap-1.5 rounded-full text-button text-brand transition-colors hover:bg-brand-subtle"
          onClick={() => {
            onOpenChange(false);
            navigate("account");
          }}
        >
          <Icon name="add" size={18} /> {t("page.addAccount")}
        </button>
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

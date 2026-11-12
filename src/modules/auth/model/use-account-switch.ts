import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ROLES, type Role } from "@/shared/constants";
import type { AuthUser } from "@/shared/types";
import { resolveHomeRoute } from "../lib/resolve-home-route";
import { useSwitchAccountMutation, useSwitchRoleMutation } from "./auth.mutations";
import { useCurrentUser } from "./use-auth";

const SELF_SERVICE_ROLES: Role[] = [ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT];

export function useAccountSwitch() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const switchAccount = useSwitchAccountMutation();
  const switchRole = useSwitchRoleMutation();
  const linkedAccounts = user?.linkedAccounts ?? [];
  const missingRoles = user
    ? SELF_SERVICE_ROLES.filter((role) => role !== user.role && !linkedAccounts.some((account) => account.role === role))
    : [];
  const pending = switchAccount.isPending || switchRole.isPending;

  async function finish(request: Promise<AuthUser>, onDone?: () => void) {
    try {
      const next = await request;
      onDone?.();
      navigate(resolveHomeRoute(next), { replace: true });
      toast.success(t("roleSwitcher.switched", { name: next.name }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("roleSwitcher.failed"));
    }
  }

  return {
    user,
    linkedAccounts,
    missingRoles,
    pending,
    pendingAccountId: switchAccount.isPending ? switchAccount.variables : null,
    pendingRole: switchRole.isPending ? switchRole.variables : null,
    toAccount(accountId: string, onDone?: () => void) {
      if (!pending) void finish(switchAccount.mutateAsync(accountId), onDone);
    },
    toRole(role: Role, onDone?: () => void) {
      if (!pending) void finish(switchRole.mutateAsync(role.toLowerCase()), onDone);
    },
  };
}

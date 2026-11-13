import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Role } from "@/shared/constants";
import type { AuthUser } from "@/shared/types";
import { switchOptions } from "../lib/account-switch";
import { resolveHomeRoute, resolvePhoneRoute } from "../lib/resolve-home-route";
import { useSwitchAccountMutation, useSwitchRoleMutation } from "./auth.mutations";
import { useCurrentUser } from "./use-auth";

export function useAccountSwitch() {
  const { t } = useTranslation("account");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const switchAccount = useSwitchAccountMutation();
  const switchRole = useSwitchRoleMutation();
  const linkedAccounts = user?.linkedAccounts ?? [];
  const { blocked, roles: missingRoles } = switchOptions(user);
  const needsPhone = blocked === "phone_required";
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
    blocked,
    needsPhone,
    pending,
    pendingAccountId: switchAccount.isPending ? switchAccount.variables : null,
    pendingRole: switchRole.isPending ? switchRole.variables : null,
    toAccount(accountId: string, onDone?: () => void) {
      if (!pending) void finish(switchAccount.mutateAsync(accountId), onDone);
    },
    toRole(role: Role, onDone?: () => void) {
      if (pending) return;
      if (needsPhone) {
        onDone?.();
        navigate(resolvePhoneRoute(user));
        return;
      }
      void finish(switchRole.mutateAsync(role.toLowerCase()), onDone);
    },
  };
}

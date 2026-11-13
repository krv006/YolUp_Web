import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Role } from "@/shared/constants";
import type { AuthUser, LinkedAccount } from "@/shared/types";
import { existingAccountOf } from "../lib/account-link";
import { switchOptions } from "../lib/account-switch";
import { resolveHomeRoute, resolvePhoneRoute } from "../lib/resolve-home-route";
import { useSwitchAccountMutation, useSwitchRoleMutation } from "./auth.mutations";
import { useCurrentUser } from "./use-auth";

export interface LinkPrompt {
  username: string;
  role: Role | null;
  onDone?: () => void;
}

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
  const [linkPrompt, setLinkPrompt] = useState<LinkPrompt | null>(null);

  async function finish(request: Promise<AuthUser>, onDone?: () => void, role?: Role) {
    try {
      const next = await request;
      onDone?.();
      navigate(resolveHomeRoute(next), { replace: true });
      toast.success(t("roleSwitcher.switched", { name: next.name }));
    } catch (error) {
      const existing = role ? existingAccountOf(error) : null;
      if (existing && role) setLinkPrompt({ username: existing.username, role, onDone });
      else toast.error(error instanceof Error ? error.message : t("roleSwitcher.failed"));
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
      void finish(switchRole.mutateAsync(role.toLowerCase()), onDone, role);
    },
    linkPrompt,
    openLink() {
      setLinkPrompt({ username: "", role: null });
    },
    closeLink() {
      setLinkPrompt(null);
    },
    afterLink(account: LinkedAccount) {
      const prompt = linkPrompt;
      setLinkPrompt(null);
      if (prompt?.role) void finish(switchRole.mutateAsync(prompt.role.toLowerCase()), prompt.onDone);
      else toast.success(t("roleSwitcher.link.done", { name: account.name }));
    },
  };
}

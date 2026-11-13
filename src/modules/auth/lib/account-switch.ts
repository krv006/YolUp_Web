import { ROLES, type Role } from "@/shared/constants";
import type { AuthUser, RoleSwitchBlock } from "@/shared/types";

const SELF_SERVICE_ROLES: Role[] = [ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT];

export interface SwitchOptions {
  blocked: RoleSwitchBlock | null;
  roles: Role[];
}

export function switchOptions(user: AuthUser | null | undefined): SwitchOptions {
  if (!user) return { blocked: null, roles: [] };
  const linked = user.linkedAccounts;
  if (user.roleSwitchBlocked === "student_not_allowed" || (user.role === ROLES.STUDENT && !linked.length))
    return { blocked: "student_not_allowed", roles: [] };
  const unopened = SELF_SERVICE_ROLES.filter(
    (role) => role !== user.role && !linked.some((account) => account.role === role)
  );
  if (user.roleSwitchBlocked === "phone_required" || !user.phone?.trim()) return { blocked: "phone_required", roles: unopened };
  return { blocked: null, roles: user.availableRoles ?? unopened };
}

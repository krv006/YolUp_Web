import { normalizeRole } from "@/modules/permission";
import { ROLES } from "@/shared/constants";

const HOME_ROUTES: Record<string, string> = Object.freeze({
  [ROLES.SUPER_ADMIN]: "/admin/dashboard",
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.TEACHER]: "/teacher/dashboard",
  [ROLES.STUDENT]: "/student/dashboard",
  [ROLES.PARENT]: "/parent/dashboard",
});

export function resolveHomeRoute(user: { role?: string } | null | undefined): string {
  return HOME_ROUTES[normalizeRole(user?.role)] ?? "/login";
}

const PHONE_ROUTES: Record<string, string> = Object.freeze({
  [ROLES.TEACHER]: "/teacher/profile/personal",
  [ROLES.STUDENT]: "/student/profile/personal",
  [ROLES.PARENT]: "/parent/settings/edit",
});

export function resolvePhoneRoute(user: { role?: string } | null | undefined): string {
  return PHONE_ROUTES[normalizeRole(user?.role)] ?? resolveHomeRoute(user);
}

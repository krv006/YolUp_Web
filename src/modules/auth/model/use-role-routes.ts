import { normalizeRole } from "@/modules/permission";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { useCurrentUser } from "./use-auth";

export function useIsStudent() {
  return normalizeRole(useCurrentUser()?.role) === ROLES.STUDENT;
}

export function useRoleRoutes() {
  return useIsStudent() ? ROUTES.student : ROUTES.teacher;
}

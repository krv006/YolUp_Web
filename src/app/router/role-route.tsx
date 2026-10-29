import { Navigate, Outlet } from "react-router-dom";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import { useConversationSync } from "@/modules/conversation";
import { hasRole } from "@/modules/permission";
import { ROLES, type Role } from "@/shared/constants";
import { ROUTES } from "@/shared/config";

export function RoleRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user } = useAuth();
  const allowed = hasRole(user, allowedRoles);
  useConversationSync(
    !allowed
      ? null
      : allowedRoles.includes(ROLES.TEACHER)
        ? "teacher"
        : allowedRoles.includes(ROLES.STUDENT)
          ? "student"
          : null
  );
  if (allowed) return <Outlet />;

  const home = user ? resolveHomeRoute(user) : null;

  if (!home || home === ROUTES.auth.login) {
    return <Navigate to={ROUTES.errors.forbidden} replace />;
  }
  return <Navigate to={home} replace />;
}

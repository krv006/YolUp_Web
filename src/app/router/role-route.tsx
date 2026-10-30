import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import { RealtimeHubContext } from "@/modules/notification";
import { hasRole } from "@/modules/permission";
import { ROLES, type Role } from "@/shared/constants";
import { ROUTES } from "@/shared/config";

const RealtimeSync = lazy(() => import("./realtime-sync").then((module) => ({ default: module.RealtimeSync })));

export function RoleRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user } = useAuth();
  const allowed = hasRole(user, allowedRoles);
  const chatRole = !allowed
    ? null
    : allowedRoles.includes(ROLES.TEACHER)
      ? "teacher"
      : allowedRoles.includes(ROLES.STUDENT)
        ? "student"
        : null;

  if (allowed) {
    return chatRole ? (
      <RealtimeHubContext.Provider value>
        <Suspense fallback={null}>
          <RealtimeSync role={chatRole} />
        </Suspense>
        <Outlet />
      </RealtimeHubContext.Provider>
    ) : (
      <Outlet />
    );
  }

  const home = user ? resolveHomeRoute(user) : null;

  if (!home || home === ROUTES.auth.login) {
    return <Navigate to={ROUTES.errors.forbidden} replace />;
  }
  return <Navigate to={home} replace />;
}

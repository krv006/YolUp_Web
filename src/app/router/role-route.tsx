import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { EmailSetupDialog, ForcePasswordDialog, resolveHomeRoute, useAuth } from "@/modules/auth";
import { PushPrompt, RealtimeHubContext } from "@/modules/notification";
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
        <ForcePasswordDialog />
        <EmailSetupDialog />
        <PushPrompt />
      </RealtimeHubContext.Provider>
    ) : (
      <>
        <Outlet />
        <ForcePasswordDialog />
        <EmailSetupDialog />
        <PushPrompt />
      </>
    );
  }

  const home = user ? resolveHomeRoute(user) : null;

  if (!home || home === ROUTES.auth.login) {
    return <Navigate to={ROUTES.errors.forbidden} replace />;
  }
  return <Navigate to={home} replace />;
}

import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { RouteState } from "@/shared/ui/legacy";
import { BootSkeleton } from "./boot-skeleton";
import { resolveHomeRoute } from "./resolve-home-route";

export function PublicRoute() {
  const { t } = useTranslation("common");
  const { user, isInitializing, initializationError, retrySession } = useAuth();
  if (isInitializing) return <BootSkeleton />;
  if (initializationError) {
    return (
      <RouteState
        eyebrow={t("routeState.connectionEyebrow")}
        title={t("routeState.sessionRestoreFailed")}
        description={initializationError.message}
        actionLabel={t("actions.retry")}
        onAction={retrySession}
      />
    );
  }
  return user ? <Navigate to={resolveHomeRoute(user)} replace /> : <Outlet />;
}

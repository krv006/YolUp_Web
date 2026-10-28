import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { RouteState } from "@/shared/ui/legacy";
import { BootSkeleton } from "./boot-skeleton";
import { resolveHomeRoute } from "./resolve-home-route";

export function PublicRoute() {
  const { user, isInitializing, initializationError, retrySession } = useAuth();
  if (isInitializing) return <BootSkeleton />;
  if (initializationError) {
    return (
      <RouteState
        eyebrow="ALOQA XATOSI"
        title="Sessiyani tiklab bo‘lmadi"
        description={initializationError.message}
        actionLabel="Qayta urinish"
        onAction={retrySession}
      />
    );
  }
  return user ? <Navigate to={resolveHomeRoute(user)} replace /> : <Outlet />;
}

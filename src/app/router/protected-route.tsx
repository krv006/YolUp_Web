import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { RouteState } from "@/shared/ui/legacy";
import { ROUTES } from "@/shared/config";
import { BootSkeleton } from "./boot-skeleton";

export function ProtectedRoute() {
  const { user, isInitializing, initializationError, retrySession } = useAuth();
  const location = useLocation();
  if (isInitializing) return <BootSkeleton />;
  if (initializationError) {
    return (
      <RouteState
        eyebrow="ALOQA XATOSI"
        title="Sessiyani tekshirib bo‘lmadi"
        description={initializationError.message}
        actionLabel="Qayta urinish"
        onAction={retrySession}
      />
    );
  }
  return user ? (
    <Outlet key={user.id} />
  ) : (
    <Navigate
      to={ROUTES.auth.login}
      replace
      state={{ from: location.pathname }}
    />
  );
}

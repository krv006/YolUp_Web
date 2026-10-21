import { useShallow } from "zustand/react/shallow";
import { AUTH_STATUS, useAuthStore } from "./auth.store";

export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === AUTH_STATUS.AUTHENTICATED,
      isInitializing: state.status === AUTH_STATUS.INITIALIZING,
      initializationError: state.status === AUTH_STATUS.ERROR ? state.error : null,
      login: state.login,
      completeTwoFactorLogin: state.completeTwoFactorLogin,
      logout: state.logout,
      retrySession: state.retry,
    }))
  );
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.status === AUTH_STATUS.AUTHENTICATED);
}

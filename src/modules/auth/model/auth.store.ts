import { create } from "zustand";
import {
  AppError,
  SESSION_EXPIRED_EVENT,
  announceSessionChange,
  tokenStorage,
  type TokenPair,
} from "@/shared/api";
import { STORAGE_KEYS } from "@/shared/constants";
import { SUPPORTED_LANGUAGES, useLanguageStore, type AppLanguage } from "@/shared/model";
import type { AuthStatus, AuthUser, LoginCredentials } from "@/shared/types";
import { authApi } from "../api/auth.api";
import type { RegisterRequestDto } from "../api/auth.dto";
import {
  mapLoginRequest,
  mapSwitchAccountResponse,
  mapTokenPairDto,
  mapUserDto,
} from "../lib/auth.mappers";
import { configureAuthRefresh } from "../lib/auth-session";
import { resolveHomeRoute } from "../lib/resolve-home-route";

let suppressLanguagePush = false;

function syncLanguageFromServer(preferred: string) {
  if (!SUPPORTED_LANGUAGES.includes(preferred as AppLanguage)) return;
  if (useLanguageStore.getState().language === preferred) return;
  suppressLanguagePush = true;
  useLanguageStore.getState().setLanguage(preferred as AppLanguage);
  suppressLanguagePush = false;
}

export const AUTH_STATUS = Object.freeze({
  ANONYMOUS: "anonymous",
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  ERROR: "error",
}) satisfies Record<string, AuthStatus>;

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: AppError | null;

  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (dto: RegisterRequestDto) => Promise<AuthUser>;
  switchAccount: (userId: string) => Promise<AuthUser>;
  switchRole: (role: string) => Promise<AuthUser>;
  adoptSession: (response: unknown) => AuthUser;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  retry: () => Promise<void>;
}

function toAppError(error: unknown): AppError {
  return error instanceof AppError
    ? error
    : new AppError({
        message: error instanceof Error ? error.message : "Sessiyani tekshirib bo‘lmadi",
      });
}

let pendingBootstrap: Promise<void> | null = null;
let sessionSeq = 0;

function beginSession(tokens: TokenPair, persistent: boolean): number {
  sessionSeq += 1;
  announceSessionChange();
  tokenStorage.setTokens(tokens, { persistent });
  return sessionSeq;
}

function endSession(): void {
  sessionSeq += 1;
  tokenStorage.clearTokens();
  announceSessionChange();
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: tokenStorage.hasSession() ? AUTH_STATUS.INITIALIZING : AUTH_STATUS.ANONYMOUS,
  error: null,

  async bootstrap() {
    pendingBootstrap ??= (async () => {
      if (!tokenStorage.hasSession()) {
        set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
        return;
      }
      set({ status: AUTH_STATUS.INITIALIZING, error: null });
      try {
        const user = mapUserDto(await authApi.getCurrentUser());
        set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
        syncLanguageFromServer(user.preferredLanguage);
      } catch (error) {
        const appError = toAppError(error);
        if (appError.status === 401) {
          tokenStorage.clearTokens();
          set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
          return;
        }
        set({ user: null, status: AUTH_STATUS.ERROR, error: appError });
      }
    })();

    try {
      await pendingBootstrap;
    } finally {
      pendingBootstrap = null;
    }
  },

  async login(credentials) {
    try {
      const tokens = mapTokenPairDto(await authApi.login(mapLoginRequest(credentials)));
      const seq = beginSession(tokens, credentials.remember !== false);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return user;
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      syncLanguageFromServer(user.preferredLanguage);
      return user;
    } catch (error) {
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  async register(dto) {
    try {
      const tokens = mapTokenPairDto(await authApi.register(dto));
      const seq = beginSession(tokens, true);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return user;
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      syncLanguageFromServer(user.preferredLanguage);
      return user;
    } catch (error) {
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  async switchAccount(userId) {
    return get().adoptSession(await authApi.switchAccount(userId));
  },

  async switchRole(role) {
    return get().adoptSession(await authApi.switchRole(role));
  },

  adoptSession(response) {
    const persistent = tokenStorage.isPersistent();
    const { tokens, user } = mapSwitchAccountResponse(response);
    beginSession(tokens, persistent);
    set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
    syncLanguageFromServer(user.preferredLanguage);
    return user;
  },

  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch (error) {
      void error;
    } finally {
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
    }
  },

  setUser(user) {
    set({ user, status: AUTH_STATUS.AUTHENTICATED });
  },

  retry() {
    return get().bootstrap();
  },
}));

configureAuthRefresh();

useLanguageStore.subscribe((state, prevState) => {
  if (suppressLanguagePush || state.language === prevState.language) return;
  if (useAuthStore.getState().status !== AUTH_STATUS.AUTHENTICATED) return;
  authApi.updateLanguage(state.language).catch(() => {
  });
});

function dropSession(): void {
  sessionSeq += 1;
  announceSessionChange();
  useAuthStore.setState({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
}

async function syncSessionFromOtherTab(): Promise<void> {
  const current = useAuthStore.getState().user;
  if (!tokenStorage.hasSession()) {
    if (current) dropSession();
    return;
  }
  if (!current) {
    await useAuthStore.getState().bootstrap();
    return;
  }
  const seq = sessionSeq;
  try {
    const next = mapUserDto(await authApi.getCurrentUser());
    if (seq !== sessionSeq || next.id === useAuthStore.getState().user?.id) return;
    sessionSeq += 1;
    announceSessionChange();
    window.location.replace(resolveHomeRoute(next));
  } catch (error) {
    void error;
  }
}

const TOKEN_KEYS: ReadonlySet<string> = new Set([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
const CROSS_TAB_DEBOUNCE_MS = 250;

if (typeof window !== "undefined") {
  window.addEventListener(SESSION_EXPIRED_EVENT, dropSession);

  let crossTabTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("storage", (event) => {
    if (event.key !== null && !TOKEN_KEYS.has(event.key)) return;
    if (crossTabTimer) clearTimeout(crossTabTimer);
    crossTabTimer = setTimeout(() => {
      crossTabTimer = undefined;
      void syncSessionFromOtherTab();
    }, CROSS_TAB_DEBOUNCE_MS);
  });
}

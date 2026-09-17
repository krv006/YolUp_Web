import { tokenStorage } from "./token-storage";

export type RefreshHandler = () => void | Promise<void>;

export const SESSION_EXPIRED_EVENT = "fokus:session-expired";
export const SESSION_CHANGED_EVENT = "fokus:session-changed";

export function announceSessionChange(): void {
  if (typeof CustomEvent === "undefined") return;
  globalThis.dispatchEvent?.(new CustomEvent(SESSION_CHANGED_EVENT));
}

export class RefreshTokenManager {
  private refreshHandler: RefreshHandler | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  configure(refreshHandler: RefreshHandler): void {
    this.refreshHandler = refreshHandler;
  }

  async refresh(): Promise<boolean> {
    if (!this.refreshHandler) return false;
    if (!this.refreshPromise) {
      const startedWith = tokenStorage.getRefreshToken();
      this.refreshPromise = Promise.resolve(this.refreshHandler())
        .then(() => true)
        .catch(() => {
          if (tokenStorage.getRefreshToken() !== startedWith && tokenStorage.hasSession()) {
            return true;
          }
          tokenStorage.clearTokens();
          if (typeof CustomEvent !== "undefined") {
            globalThis.dispatchEvent?.(new CustomEvent(SESSION_EXPIRED_EVENT));
          }
          return false;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }
}

export const refreshTokenManager = new RefreshTokenManager();

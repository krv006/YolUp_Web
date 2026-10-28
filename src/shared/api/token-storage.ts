import { STORAGE_KEYS } from "@/shared/constants";

export interface TokenPair {
  accessToken?: string | null;
  refreshToken?: string | null;
}

function storages(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage];
}

function read(key: string): string | null {
  for (const target of storages()) {
    try {
      const value = target.getItem(key);
      if (value) return value;
    } catch (error) {
      void error;
    }
  }
  return null;
}

function removeEverywhere(key: string): void {
  storages().forEach((target) => {
    try {
      target.removeItem(key);
    } catch (error) {
      void error;
    }
  });
}

export const tokenStorage = {
  getAccessToken: (): string | null => read(STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: (): string | null => read(STORAGE_KEYS.REFRESH_TOKEN),

  hasSession(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken());
  },

  isPersistent(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return Boolean(window.localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
    } catch {
      return false;
    }
  },

  setTokens({ accessToken, refreshToken }: TokenPair, { persistent = true } = {}): void {
    const targets = storages();
    const target = persistent ? targets[1] : targets[0];
    this.clearTokens();
    if (!target) return;
    if (accessToken) target.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) target.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearTokens(): void {
    removeEverywhere(STORAGE_KEYS.ACCESS_TOKEN);
    removeEverywhere(STORAGE_KEYS.REFRESH_TOKEN);
    removeEverywhere(STORAGE_KEYS.USER_SNAPSHOT);
  },

  readUser(): string | null {
    return this.hasSession() ? read(STORAGE_KEYS.USER_SNAPSHOT) : null;
  },

  writeUser(value: string | null): void {
    removeEverywhere(STORAGE_KEYS.USER_SNAPSHOT);
    if (!value || !this.hasSession()) return;
    const targets = storages();
    const target = this.isPersistent() ? targets[1] : targets[0];
    try {
      target?.setItem(STORAGE_KEYS.USER_SNAPSHOT, value);
    } catch (error) {
      void error;
    }
  },

  clear(): void {
    this.clearTokens();
  },
};

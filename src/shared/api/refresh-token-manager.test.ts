import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshTokenManager, SESSION_EXPIRED_EVENT } from "./refresh-token-manager";
import { tokenStorage } from "./token-storage";

describe("RefreshTokenManager", () => {
  beforeEach(() => {
    tokenStorage.clear();
    tokenStorage.setTokens({ accessToken: "a1", refreshToken: "r1" });
  });
  afterEach(() => {
    tokenStorage.clear();
  });

  it("does nothing without a configured handler", async () => {
    expect(await new RefreshTokenManager().refresh()).toBe(false);
  });

  it("shares one refresh between parallel callers (single-flight)", async () => {
    const manager = new RefreshTokenManager();
    const handler = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));
    manager.configure(handler);
    const results = await Promise.all([manager.refresh(), manager.refresh(), manager.refresh()]);
    expect(results).toEqual([true, true, true]);
    expect(handler).toHaveBeenCalledTimes(1);
    // keyingi alohida yangilash yana ishlaydi
    await manager.refresh();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("expires the session (clears tokens, announces it) when the refresh fails", async () => {
    const manager = new RefreshTokenManager();
    manager.configure(() => Promise.reject(new Error("401")));
    const expired = vi.fn();
    globalThis.addEventListener(SESSION_EXPIRED_EVENT, expired);
    expect(await manager.refresh()).toBe(false);
    globalThis.removeEventListener(SESSION_EXPIRED_EVENT, expired);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.hasSession()).toBe(false);
  });

  it("treats a failure as success when another tab already rotated the tokens", async () => {
    const manager = new RefreshTokenManager();
    manager.configure(() => {
      tokenStorage.setTokens({ accessToken: "a2", refreshToken: "r2" });
      return Promise.reject(new Error("old refresh token was blacklisted"));
    });
    expect(await manager.refresh()).toBe(true);
    expect(tokenStorage.getAccessToken()).toBe("a2");
  });
});

describe("tokenStorage", () => {
  afterEach(() => tokenStorage.clear());

  it("keeps a persistent session in localStorage and a non-persistent one in sessionStorage", () => {
    tokenStorage.setTokens({ accessToken: "a", refreshToken: "r" }, { persistent: true });
    expect(tokenStorage.isPersistent()).toBe(true);
    tokenStorage.setTokens({ accessToken: "b", refreshToken: "s" }, { persistent: false });
    expect(tokenStorage.isPersistent()).toBe(false);
    expect(tokenStorage.getAccessToken()).toBe("b");
    expect(globalThis.localStorage.length).toBe(0);
  });

  it("clear() also forgets the cached user", () => {
    tokenStorage.setTokens({ accessToken: "a", refreshToken: "r" });
    tokenStorage.writeUser('{"id":1}');
    expect(tokenStorage.readUser()).toBe('{"id":1}');
    tokenStorage.clear();
    expect(tokenStorage.readUser()).toBeNull();
    expect(tokenStorage.hasSession()).toBe(false);
  });
});

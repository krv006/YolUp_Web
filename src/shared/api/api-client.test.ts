import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api-client";
import { API_ERROR_CODES, AppError } from "./api-error";
import { refreshTokenManager, SESSION_EXPIRED_EVENT } from "./refresh-token-manager";
import { tokenStorage } from "./token-storage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const authOf = (call: unknown[]) => ((call[1] as RequestInit).headers as Record<string, string>).Authorization;

describe("ApiClient", () => {
  const client = new ApiClient({ baseUrl: "https://api.test", timeoutMs: 1000 });
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenStorage.setTokens({ accessToken: "old", refreshToken: "r1" });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    refreshTokenManager.configure(() => tokenStorage.setTokens({ accessToken: "new", refreshToken: "r2" }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    tokenStorage.clear();
    refreshTokenManager.configure(() => undefined);
  });

  it("refreshes the token after a 401 and retries once with the new token", async () => {
    fetchMock.mockResolvedValueOnce(json({ detail: "expired" }, 401)).mockResolvedValueOnce(json({ id: 7 }));
    expect(await client.get("/api/v1/me/")).toEqual({ id: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authOf(fetchMock.mock.calls[0])).toBe("Bearer old");
    expect(authOf(fetchMock.mock.calls[1])).toBe("Bearer new");
  });

  it("expires the session when the retry is still unauthorized", async () => {
    fetchMock.mockResolvedValue(json({ detail: "no" }, 401));
    const expired = vi.fn();
    globalThis.addEventListener(SESSION_EXPIRED_EVENT, expired);
    await expect(client.get("/api/v1/me/")).rejects.toMatchObject({ code: API_ERROR_CODES.UNAUTHORIZED });
    globalThis.removeEventListener(SESSION_EXPIRED_EVENT, expired);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it("does not refresh for requests that opt out", async () => {
    fetchMock.mockResolvedValue(json({ detail: "bad credentials" }, 401));
    await expect(client.post("/api/v1/auth/login/", { a: 1 }, { skipRefresh: true })).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("turns a failed fetch into a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(client.get("/api/v1/x/")).rejects.toMatchObject({ code: API_ERROR_CODES.NETWORK_ERROR });
  });

  it("reports a timeout", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))
    );
    await expect(client.get("/api/v1/slow/", { timeoutMs: 20 })).rejects.toMatchObject({ code: API_ERROR_CODES.TIMEOUT });
  });

  it("reports a request cancelled by the caller", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))
    );
    const controller = new AbortController();
    const pending = client.get("/api/v1/slow/", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: API_ERROR_CODES.REQUEST_ABORTED });
  });
});

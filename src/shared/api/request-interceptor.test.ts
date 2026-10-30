import { afterEach, describe, expect, it } from "vitest";
import { appendQuery, buildRequestUrl, createRequestInit } from "./request-interceptor";
import { tokenStorage } from "./token-storage";

const signal = new AbortController().signal;
const headersOf = (init: RequestInit) => init.headers as Record<string, string>;

describe("appendQuery", () => {
  it("skips empty values and repeats arrays", () => {
    expect(appendQuery("/x/", { a: 1, b: "", c: null, d: undefined, e: [1, 2], f: false })).toBe("/x/?a=1&e=1&e=2&f=false");
  });

  it("keeps an existing query string", () => {
    expect(appendQuery("/x/?page=2", { q: "salom" })).toBe("/x/?page=2&q=salom");
    expect(appendQuery("/x/", {})).toBe("/x/");
  });
});

describe("buildRequestUrl", () => {
  it("joins the base and path and leaves absolute URLs alone", () => {
    expect(buildRequestUrl("https://api.test", "api/v1/me/")).toBe("https://api.test/api/v1/me/");
    expect(buildRequestUrl("https://api.test", "/api/v1/me/", { a: 1 })).toBe("https://api.test/api/v1/me/?a=1");
    expect(buildRequestUrl("https://api.test", "https://cdn.test/f.pdf")).toBe("https://cdn.test/f.pdf");
  });
});

describe("createRequestInit", () => {
  afterEach(() => tokenStorage.clear());

  it("sends JSON with the bearer token and request id", () => {
    tokenStorage.setTokens({ accessToken: "a1", refreshToken: "r1" });
    const init = createRequestInit({ body: { x: 1 }, requestId: "req-1" }, signal, { Accept: "application/json" });
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"x":1}');
    expect(headersOf(init)).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer a1",
      "X-Request-ID": "req-1",
    });
    expect(headersOf(init)["Accept-Language"]).toBeTruthy();
  });

  it("lets the browser set the multipart boundary for FormData", () => {
    const form = new FormData();
    form.set("file", new Blob(["x"]), "a.txt");
    const init = createRequestInit({ body: form, method: "POST" }, signal, {});
    expect(init.body).toBe(form);
    expect(headersOf(init)["Content-Type"]).toBeUndefined();
  });

  it("does not attach the token for public requests", () => {
    tokenStorage.setTokens({ accessToken: "a1", refreshToken: "r1" });
    const init = createRequestInit({ skipAuth: true }, signal, {});
    expect(init.method).toBe("GET");
    expect(headersOf(init).Authorization).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";
import { shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  it("retries network-type errors up to twice", () => {
    for (const code of [API_ERROR_CODES.NETWORK_ERROR, API_ERROR_CODES.OFFLINE, API_ERROR_CODES.TIMEOUT, API_ERROR_CODES.SERVER_ERROR]) {
      const error = new AppError({ code });
      expect(shouldRetry(0, error)).toBe(true);
      expect(shouldRetry(1, error)).toBe(true);
      expect(shouldRetry(2, error)).toBe(false);
    }
  });

  it("never retries client errors or unknown errors", () => {
    expect(shouldRetry(0, new AppError({ code: API_ERROR_CODES.FORBIDDEN, status: 403 }))).toBe(false);
    expect(shouldRetry(0, new AppError({ code: API_ERROR_CODES.VALIDATION_ERROR, status: 400 }))).toBe(false);
    expect(shouldRetry(0, new Error("boom"))).toBe(false);
  });
});

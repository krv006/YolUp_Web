import { describe, expect, it } from "vitest";
import { createApiError } from "@/shared/api";
import { ROLES } from "@/shared/constants";
import { existingAccountOf, linkErrorOf } from "./account-link";

const fail = (status: number, error: Record<string, unknown>) => createApiError({ status, payload: { success: false, error } });

describe("account linking", () => {
  it("reads the unlinked account behind a 409 from switch-role", () => {
    const error = fail(409, {
      code: "account_exists",
      message: "Bu rolda akkaunt bor.",
      details: { detail: "Bu rolda akkaunt bor.", account: { id: "t9", username: "ustoz_ali", role: "teacher" } },
    });
    expect(existingAccountOf(error)).toEqual({ id: "t9", username: "ustoz_ali", role: ROLES.TEACHER });
    expect(existingAccountOf(fail(403, { code: "permission_denied", message: "Yo'q" }))).toBeNull();
    expect(existingAccountOf(new Error("x"))).toBeNull();
  });

  it("puts a wrong password under the password field", () => {
    const error = fail(400, { code: "invalid", message: "Login yoki parol noto'g'ri.", details: { password: ["Login yoki parol noto'g'ri."] } });
    expect(linkErrorOf(error)).toEqual({ kind: "field", field: "password", message: "Login yoki parol noto'g'ri.", retryMinutes: null });
  });

  it("puts login problems under the login field", () => {
    const error = fail(400, { code: "invalid", message: "Bu akkaunt allaqachon bog'langan.", details: { username: ["Bu akkaunt allaqachon bog'langan."] } });
    expect(linkErrorOf(error)).toMatchObject({ kind: "field", field: "username" });
  });

  it("recognises a two-factor account and the 15 minute lock", () => {
    expect(linkErrorOf(fail(400, { code: "two_factor_enabled", message: "2FA" })).kind).toBe("two_factor");
    expect(linkErrorOf(fail(429, { code: "throttled", message: "Ko'p", retry_after: 900 }))).toMatchObject({
      kind: "throttled",
      retryMinutes: 15,
    });
    expect(linkErrorOf(fail(429, { code: "throttled", message: "Ko'p" })).retryMinutes).toBeNull();
  });
});

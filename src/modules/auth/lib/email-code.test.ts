import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/api";
import { createRegisterSchema } from "../model/auth.schemas";
import { describeEmailCodeError, isValidEmail, normalizeEmail } from "./email-code";

const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key) as unknown as TFunction<"auth">;

describe("email code helpers", () => {
  it("accepts real addresses only and lowercases them", () => {
    expect(isValidEmail("Ali@Example.com")).toBe(true);
    expect(isValidEmail("ali@example")).toBe(false);
    expect(isValidEmail("ali example.com")).toBe(false);
    expect(normalizeEmail("  Ali@Example.COM ")).toBe("ali@example.com");
  });

  it("explains the email service and rate limit errors", () => {
    expect(describeEmailCodeError(new AppError({ status: 503 }), t)).toBe("email.unavailable");
    expect(describeEmailCodeError(new AppError({ status: 502 }), t)).toBe("email.sendFailed");
    expect(describeEmailCodeError(new AppError({ status: 429, retryAfter: 40 }), t)).toBe('email.tooManyWait:{"seconds":40}');
    expect(describeEmailCodeError(new AppError({ status: 429 }), t)).toBe("email.tooMany");
    expect(describeEmailCodeError(new AppError({ status: 400, fields: { email: ["Email noto'g'ri"] } }), t)).toBe("Email noto'g'ri");
    expect(describeEmailCodeError(new Error("x"), t)).toBe("email.failed");
  });

  it("does not allow @ in a new login", () => {
    const schema = createRegisterSchema(t);
    const base = { password: "Parol1234", firstName: "Ali", lastName: "Valiyev", role: "student" as const };
    expect(schema.safeParse({ ...base, username: "ali@mail.uz" }).success).toBe(false);
    expect(schema.safeParse({ ...base, username: "ali_valiyev" }).success).toBe(true);
  });
});

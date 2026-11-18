import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/api";
import { passwordChangeIssues, passwordChangeServerErrors, passwordMeetsRule } from "./password-change";

describe("password change checks", () => {
  it("follows the shown rule: 8 characters, a digit and a capital letter", () => {
    expect(passwordMeetsRule("Parol123")).toBe(true);
    expect(passwordMeetsRule("parol123")).toBe(false);
    expect(passwordMeetsRule("Parolsiz")).toBe(false);
    expect(passwordMeetsRule("Pa1")).toBe(false);
  });

  it("points at the field that needs fixing before anything is sent", () => {
    expect(passwordChangeIssues("", "Yangi1234", "Yangi1234")).toEqual({ current: "required" });
    expect(passwordChangeIssues("Eski1234", "yangi", "yangi")).toEqual({ next: "rule" });
    expect(passwordChangeIssues("Eski1234", "Eski1234", "Eski1234")).toEqual({ next: "same" });
    expect(passwordChangeIssues("Eski1234", "Yangi1234", "Yangi12")).toEqual({ repeat: "mismatch" });
    expect(passwordChangeIssues("Eski1234", "Yangi1234", "Yangi1234")).toEqual({});
  });

  it("puts server errors under the right field", () => {
    expect(passwordChangeServerErrors(new AppError({ status: 400, message: "Joriy parol noto'g'ri", fields: { detail: ["Joriy parol noto'g'ri"] } }), "x")).toEqual({ current: "Joriy parol noto'g'ri" });
    expect(passwordChangeServerErrors(new AppError({ status: 400, message: "too common", fields: { new_password: ["This password is too common.", "It is entirely numeric."] } }), "x")).toEqual({ next: "This password is too common. It is entirely numeric." });
    expect(passwordChangeServerErrors(new AppError({ status: 429, message: "Juda ko'p urinish" }), "x")).toEqual({ form: "Juda ko'p urinish" });
    expect(passwordChangeServerErrors(new Error("net"), "fallback")).toEqual({ form: "fallback" });
  });
});

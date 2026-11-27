import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";
import { loginErrorMessage } from "./login-error";

const fallback = "Login, email yoki parol noto‘g‘ri";

describe("loginErrorMessage", () => {
  it("shows the backend reason for an unverified or shared email and for too many attempts", () => {
    const unverified = new AppError({ status: 400, code: API_ERROR_CODES.VALIDATION_ERROR, message: "Email hali tasdiqlanmagan. Login (username) bilan kiring va emailni profilda tasdiqlang." });
    expect(loginErrorMessage(unverified, "ru", fallback)).toBe(unverified.message);
    const limited = new AppError({ status: 429, message: "Juda ko'p muvaffaqiyatsiz urinish" });
    expect(loginErrorMessage(limited, "uz", fallback)).toBe(limited.message);
  });

  it("uses the backend 401 text only in Uzbek and never the session-expired default", () => {
    const wrong = new AppError({ status: 401, message: "Login yoki parol noto'g'ri.", details: { detail: "Login yoki parol noto'g'ri." } });
    expect(loginErrorMessage(wrong, "uz", fallback)).toBe("Login yoki parol noto'g'ri.");
    expect(loginErrorMessage(wrong, "ru", "Неверный логин")).toBe("Неверный логин");
    expect(loginErrorMessage(new AppError({ status: 401, message: "Sessiya tugagan. Qayta kiring." }), "uz", fallback)).toBe(fallback);
  });

  it("keeps network messages", () => {
    expect(loginErrorMessage(new AppError({ code: API_ERROR_CODES.OFFLINE, message: "Internet aloqasi mavjud emas" }), "uz", fallback)).toBe("Internet aloqasi mavjud emas");
  });
});

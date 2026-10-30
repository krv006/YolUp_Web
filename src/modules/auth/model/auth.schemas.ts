import { z } from "@/shared/lib/zod";
import type { TFunction } from "i18next";

export function createLoginSchema(t: TFunction<"auth">) {
  return z.object({
    login: z.string().trim().min(1, t("validation.loginRequired")),
    password: z.string().min(1, t("validation.passwordRequired")),
    remember: z.boolean().optional(),
  });
}

export function createRegisterSchema(t: TFunction<"auth">) {
  return z.object({
    username: z.string().trim().min(3, t("validation.usernameMinLength")),
    password: z.string().min(8, t("validation.passwordMinLength")),
    firstName: z.string().trim().min(1, t("validation.firstNameRequired")),
    lastName: z.string().trim().min(1, t("validation.lastNameRequired")),
    phone: z.string().trim().optional(),
    role: z.enum(["teacher", "parent", "student"]),
  });
}

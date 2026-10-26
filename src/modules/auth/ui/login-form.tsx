import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { applyApiFieldErrors } from "@/shared/api";
import { createLoginSchema } from "../model/auth.schemas";
import type { AppError } from "@/shared/api";
import type { LoginCredentials } from "@/shared/types";
import { AuthButton, AuthField, AuthFieldError, AuthPasswordField } from "./auth-screen";

export interface LoginFormProps {
  onSubmit: (values: LoginCredentials) => Promise<unknown>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "", remember: true },
  });

  async function submit(values: LoginCredentials) {
    try {
      await onSubmit(values);
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { username: "login" })) {
        setError("root", { type: "server", message: appError.message });
      }
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <AuthField
          id="login"
          autoComplete="username"
          placeholder={t("form.loginPlaceholder")}
          invalid={Boolean(errors.login)}
          {...register("login")}
        />
        {errors.login ? <AuthFieldError>{errors.login.message}</AuthFieldError> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <AuthPasswordField
          id="password"
          autoComplete="current-password"
          placeholder={t("form.passwordPlaceholder")}
          visible={showPassword}
          invalid={Boolean(errors.password)}
          onToggle={() => setShowPassword((value) => !value)}
          {...register("password")}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}
      </div>

      <Link
        className="self-end px-2 text-body-sm text-brand transition-opacity hover:opacity-80"
        to="/forgot-password"
      >
        {t("mobile.login.forgotPassword")}
      </Link>

      {errors.root ? (
        <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <div className="pt-3">
        <AuthButton type="submit" loading={isSubmitting}>
          {t("form.submit")}
        </AuthButton>
      </div>
    </form>
  );
}

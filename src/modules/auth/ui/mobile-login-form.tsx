import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { useOnline } from "@/shared/hooks/use-online";
import { showErrorToast } from "@/shared/ui/app-toast";
import type { LoginCredentials } from "@/shared/types";
import { createLoginSchema } from "../model/auth.schemas";
import {
  AuthButton,
  AuthField,
  AuthFieldError,
  AuthPasswordField,
  AuthScreen,
} from "./auth-screen";

export interface MobileLoginFormProps {
  onSubmit: (values: LoginCredentials) => Promise<unknown>;
}

export function MobileLoginForm({ onSubmit }: MobileLoginFormProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const online = useOnline();
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

  const failed = Boolean(errors.root);

  async function submit(values: LoginCredentials) {
    try {
      await onSubmit(values);
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { username: "login" })) {
        setError("root", { type: "server", message: t("mobile.login.failed") });
      }
      showErrorToast({
        title: t("mobile.login.errorToastTitle"),
        description: t("mobile.login.errorToastDescription"),
      });
    }
  }

  return (
    <AuthScreen
      layout="spaced"
      onBack={() => navigate(-1)}
      title={t("mobile.login.title")}
      description={t("mobile.login.subtitle")}
      notice={
        online ? null : (
          <p className="flex items-start gap-2.5 rounded-2xl bg-subtle px-4 py-3.5 text-body-sm text-ink-secondary">
            <CloudOff size={18} className="mt-0.5 shrink-0" />
            {t("mobile.login.offline")}
          </p>
        )
      }
      action={
        <AuthButton
          type="submit"
          form="mobile-login-form"
          loading={isSubmitting}
          loadingLabel={t("mobile.login.submitting")}
          disabled={!online}
        >
          {t("form.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.login.noAccount")}{" "}
          <Link className="text-brand-strong" to="/register">
            {t("mobile.login.registerLink")}
          </Link>
        </>
      }
    >
      <form
        id="mobile-login-form"
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div className="flex flex-col gap-1">
          <AuthField
            autoComplete="username"
            label={t("form.loginLabel")}
            placeholder={t("form.loginPlaceholder")}
            invalid={Boolean(errors.login) || failed}
            {...register("login")}
          />
          {errors.login ? <AuthFieldError>{errors.login.message}</AuthFieldError> : null}
        </div>

        <div className="flex flex-col gap-1">
          <AuthPasswordField
            autoComplete="current-password"
            label={t("form.passwordLabel")}
            placeholder={t("form.passwordPlaceholder")}
            invalid={Boolean(errors.password) || failed}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            {...register("password")}
          />
          {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}
          {failed ? <AuthFieldError>{errors.root?.message}</AuthFieldError> : null}
        </div>

        <Link
          className="self-end text-body-sm text-brand-strong transition-opacity hover:opacity-80"
          to="/forgot-password"
        >
          {t("mobile.login.forgotPassword")}
        </Link>
      </form>
    </AuthScreen>
  );
}

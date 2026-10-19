import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { useOnline } from "@/shared/hooks/use-online";
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
      toast.error(t("mobile.login.errorToastTitle"), {
        description: t("mobile.login.errorToastDescription"),
      });
    }
  }

  return (
    <AuthScreen
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
          <Link className="text-action" to="/register">
            {t("mobile.login.registerLink")}
          </Link>
        </>
      }
    >
      <form
        id="mobile-login-form"
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <AuthField
          autoComplete="username"
          placeholder={t("form.loginPlaceholder")}
          aria-label={t("form.loginLabel")}
          invalid={Boolean(errors.login) || failed}
          {...register("login")}
        />
        {errors.login ? <AuthFieldError>{errors.login.message}</AuthFieldError> : null}

        <AuthPasswordField
          autoComplete="current-password"
          placeholder={t("form.passwordPlaceholder")}
          aria-label={t("form.passwordLabel")}
          invalid={Boolean(errors.password) || failed}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          {...register("password")}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}
        {failed ? <AuthFieldError>{errors.root?.message}</AuthFieldError> : null}

        <Link className="self-end px-2 text-label-strong text-action" to="/forgot-password">
          {t("mobile.login.forgotPassword")}
        </Link>
      </form>
    </AuthScreen>
  );
}

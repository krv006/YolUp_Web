import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { applyApiFieldErrors } from "@/shared/api";
import { createRegisterSchema } from "../model/auth.schemas";
import type { AppError } from "@/shared/api";
import type { RegisterFormValues } from "../api/auth.dto";
import { AuthButton, AuthField, AuthFieldError, AuthPasswordField } from "./auth-screen";

const ROLES = ["teacher", "parent", "student"] as const;

export interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<unknown>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "teacher",
    },
  });

  async function submit(values: RegisterFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { first_name: "firstName", last_name: "lastName" }))
        setError("root", { message: appError.message });
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)} noValidate>
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <div
            className="flex items-center gap-1 rounded-full bg-subtle p-1"
            aria-label={t("register.roleLabel")}
          >
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-full text-button transition-colors ${
                  field.value === role
                    ? "bg-brand text-on-action"
                    : "text-ink-secondary hover:text-ink"
                }`}
                onClick={() => field.onChange(role)}
              >
                {t(`register.role.${role}`)}
              </button>
            ))}
          </div>
        )}
      />

      <div className="grid grid-cols-2 items-start gap-3">
        <div className="flex flex-col gap-1.5">
          <AuthField
            autoComplete="given-name"
            placeholder={t("register.form.firstName")}
            invalid={Boolean(errors.firstName)}
            {...register("firstName")}
          />
          {errors.firstName ? <AuthFieldError>{errors.firstName.message}</AuthFieldError> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthField
            autoComplete="family-name"
            placeholder={t("register.form.lastName")}
            invalid={Boolean(errors.lastName)}
            {...register("lastName")}
          />
          {errors.lastName ? <AuthFieldError>{errors.lastName.message}</AuthFieldError> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <AuthField
          autoComplete="username"
          placeholder={t("register.form.username")}
          invalid={Boolean(errors.username)}
          {...register("username")}
        />
        {errors.username ? <AuthFieldError>{errors.username.message}</AuthFieldError> : null}
      </div>

      <AuthField
        type="tel"
        autoComplete="tel"
        placeholder="+998 90 123 45 67"
        {...register("phone")}
      />

      <div className="flex flex-col gap-1.5">
        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("register.form.password")}
          visible={showPassword}
          invalid={Boolean(errors.password)}
          onToggle={() => setShowPassword((value) => !value)}
          {...register("password")}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}
      </div>

      {errors.root ? (
        <p className="rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <AuthButton type="submit" loading={isSubmitting}>
        {t("register.form.submit")}
      </AuthButton>
    </form>
  );
}

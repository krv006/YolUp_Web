import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import type { RegisterFormValues } from "../api/auth.dto";
import { createRegisterSchema } from "../model/auth.schemas";
import {
  AuthButton,
  AuthField,
  AuthFieldError,
  AuthPasswordField,
  AuthPhoneField,
  AuthScreen,
} from "./auth-screen";

const ROLES = ["teacher", "parent", "student"] as const;

export interface MobileRegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<unknown>;
  onDone: () => void;
}

export function MobileRegisterForm({ onSubmit, onDone }: MobileRegisterFormProps) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [created, setCreated] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
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
    if (values.password !== confirm) {
      setConfirmError(t("mobile.register.mismatch"));
      return;
    }
    setConfirmError(null);
    try {
      await onSubmit(values);
      setCreated(true);
    } catch (error) {
      const appError = error as AppError;
      if (
        !applyApiFieldErrors(appError, setError, { first_name: "firstName", last_name: "lastName" })
      ) {
        setError("root", { message: appError.message });
      }
    }
  }

  if (created)
    return (
      <AuthScreen
        onBack={() => navigate("/login")}
        action={<AuthButton onClick={onDone}>{t("mobile.register.start")}</AuthButton>}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-success-bg text-success-text">
            <Check size={34} strokeWidth={3} />
          </span>
          <h1 className="font-heading text-h1 text-ink">{t("mobile.register.doneTitle")}</h1>
          <p className="max-w-[320px] text-body text-ink-secondary">
            {t("mobile.register.doneDescription")}
          </p>
        </div>
      </AuthScreen>
    );

  return (
    <AuthScreen
      onBack={() => navigate(-1)}
      title={t("mobile.register.title")}
      description={t("register.subtitle")}
      action={
        <AuthButton
          type="submit"
          form="mobile-register-form"
          loading={isSubmitting}
          loadingLabel={t("mobile.register.submitting")}
        >
          {t("mobile.login.registerLink")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.register.haveAccount")}{" "}
          <Link className="text-action" to="/login">
            {t("form.submit")}
          </Link>
        </>
      }
    >
      <form
        id="mobile-register-form"
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <div
              className="flex items-center gap-1 rounded-full bg-subtle p-1"
              role="radiogroup"
              aria-label={t("register.roleLabel")}
            >
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={field.value === role}
                  className={`h-11 flex-1 rounded-full text-label-strong transition-colors ${
                    field.value === role
                      ? "bg-surface text-ink shadow-sm"
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

        <div className="grid grid-cols-2 gap-3">
          <AuthField
            autoComplete="given-name"
            placeholder={t("register.form.firstName")}
            aria-label={t("register.form.firstName")}
            invalid={Boolean(errors.firstName)}
            {...register("firstName")}
          />
          <AuthField
            autoComplete="family-name"
            placeholder={t("register.form.lastName")}
            aria-label={t("register.form.lastName")}
            invalid={Boolean(errors.lastName)}
            {...register("lastName")}
          />
        </div>
        {errors.firstName || errors.lastName ? (
          <AuthFieldError>{errors.firstName?.message ?? errors.lastName?.message}</AuthFieldError>
        ) : null}

        <AuthField
          autoComplete="username"
          placeholder={t("register.form.username")}
          aria-label={t("register.form.username")}
          invalid={Boolean(errors.username)}
          {...register("username")}
        />
        {errors.username ? <AuthFieldError>{errors.username.message}</AuthFieldError> : null}

        <AuthPhoneField
          placeholder={t("mobile.reset.phonePlaceholder")}
          aria-label={t("register.form.phone")}
          hint={t("mobile.reset.phoneHint")}
          {...register("phone")}
        />

        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("register.form.password")}
          aria-label={t("register.form.password")}
          invalid={Boolean(errors.password) || Boolean(confirmError)}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          {...register("password")}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}

        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("mobile.newPassword.confirmPlaceholder")}
          aria-label={t("mobile.newPassword.confirmPlaceholder")}
          value={confirm}
          invalid={Boolean(confirmError)}
          visible={showConfirm}
          onToggle={() => setShowConfirm((value) => !value)}
          onChange={(event) => {
            setConfirmError(null);
            setConfirm(event.target.value);
          }}
          onBlur={() => {
            if (confirm && getValues("password") !== confirm)
              setConfirmError(t("mobile.register.mismatch"));
          }}
        />
        {confirmError ? <AuthFieldError>{confirmError}</AuthFieldError> : null}
        {errors.root ? <AuthFieldError>{errors.root.message}</AuthFieldError> : null}
      </form>
    </AuthScreen>
  );
}

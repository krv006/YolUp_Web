import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/shared/api";
import type { RegisterFormValues } from "../api/auth.dto";
import type { RegisterEmail } from "../ui/register-email-field";
import { useRegisterOptions } from "./auth.queries";

function fieldMessage(error: AppError, key: string): string | null {
  const value = error.fields?.[key];
  if (Array.isArray(value)) return value[0] ? String(value[0]) : null;
  return value ? String(value) : null;
}

export function useRegisterEmail() {
  const { t } = useTranslation("auth");
  const options = useRegisterOptions().data ?? { emailAvailable: false, emailRequired: false };
  const [value, setValue] = useState<RegisterEmail>({ email: "", token: null });
  const [error, setError] = useState<string | null>(null);
  const [fieldKey, setFieldKey] = useState(0);

  function change(next: RegisterEmail) {
    setError(null);
    setValue(next);
  }

  function validate(): boolean {
    if (!options.emailAvailable) return true;
    if (options.emailRequired && !value.token) {
      setError(t("email.required"));
      return false;
    }
    if (value.email.trim() && !value.token) {
      setError(t("email.verifyFirst"));
      return false;
    }
    return true;
  }

  function withEmail(values: RegisterFormValues): RegisterFormValues {
    return value.token && options.emailAvailable ? { ...values, email: value.email, emailToken: value.token } : values;
  }

  function takeServerError(caught: unknown): boolean {
    if (!(caught instanceof AppError)) return false;
    const message = fieldMessage(caught, "email_token") ?? fieldMessage(caught, "email");
    if (!message) return false;
    setValue((current) => ({ email: current.email, token: null }));
    setFieldKey((key) => key + 1);
    setError(message);
    return true;
  }

  return {
    visible: options.emailAvailable,
    required: options.emailRequired,
    value,
    change,
    error,
    fieldKey,
    validate,
    withEmail,
    takeServerError,
  };
}

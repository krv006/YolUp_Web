import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/shared/api";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useChangePasswordMutation } from "../model/auth.mutations";
import { useAuth } from "../model/use-auth";

const INPUT =
  "h-13 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus focus:bg-surface";

export function ForcePasswordDialog() {
  const { t } = useTranslation("auth");
  const { user } = useAuth();
  const change = useChangePasswordMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next.length < 8 || !/\d/.test(next)) return setError(t("forcePassword.weak"));
    if (next !== repeat) return setError(t("forcePassword.mismatch"));
    setError("");
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onError: (cause) => {
          const fields = cause instanceof AppError ? cause.fields : null;
          const value = fields?.current_password ?? fields?.new_password;
          setError(Array.isArray(value) ? value.join(" ") : value ? String(value) : cause.message);
        },
      }
    );
  }

  return (
    <AppDialog
      open={Boolean(user?.mustChangePassword)}
      onOpenChange={() => undefined}
      variant="confirm"
      width="lg:w-120"
      layout="centered"
      icon={
        <span className="grid size-14 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="key" size={26} />
        </span>
      }
      title={t("forcePassword.title")}
      description={t("forcePassword.text")}
      footer={
        <button type="submit" form="force-password" className={dialogButton.primary} disabled={!current || !next || !repeat || change.isPending}>
          {t("forcePassword.submit")}
        </button>
      }
    >
      <form id="force-password" className="flex flex-col gap-3" onSubmit={submit}>
        {[
          { key: "current", label: t("forcePassword.current"), value: current, set: setCurrent, auto: "current-password" },
          { key: "next", label: t("forcePassword.next"), value: next, set: setNext, auto: "new-password" },
          { key: "repeat", label: t("forcePassword.repeat"), value: repeat, set: setRepeat, auto: "new-password" },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-body-sm font-medium text-ink">{field.label}</span>
            <input
              className={INPUT}
              type="password"
              autoComplete={field.auto}
              value={field.value}
              onChange={(event) => {
                setError("");
                field.set(event.target.value);
              }}
            />
          </label>
        ))}
        <small className={`text-body-xs ${error ? "text-error-text" : "text-ink-tertiary"}`}>{error || t("forcePassword.rule")}</small>
      </form>
    </AppDialog>
  );
}

import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LinkedAccount } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { linkErrorOf, type LinkError } from "../lib/account-link";
import { useLinkAccountMutation } from "../model/auth.mutations";
import type { LinkPrompt } from "../model/use-account-switch";

const INPUT =
  "h-12 w-full rounded-xl border border-transparent bg-subtle px-4 text-body text-ink outline-none transition-colors focus:border-focus focus:bg-surface read-only:text-ink-secondary aria-invalid:border-danger";

export interface LinkAccountDialogProps {
  prompt: LinkPrompt | null;
  onClose: () => void;
  onLinked: (account: LinkedAccount) => void;
}

export function LinkAccountDialog({ prompt, onClose, onLinked }: LinkAccountDialogProps) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const link = useLinkAccountMutation();
  const id = useId();
  const [seed, setSeed] = useState(prompt);
  const [username, setUsername] = useState(prompt?.username ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LinkError | null>(null);

  if (seed !== prompt) {
    setSeed(prompt);
    setUsername(prompt?.username ?? "");
    setPassword("");
    setError(null);
  }

  const locked = Boolean(prompt?.role);
  const message =
    error?.kind === "two_factor"
      ? t("roleSwitcher.link.twoFactor")
      : error?.kind === "throttled"
        ? error.retryMinutes
          ? t("roleSwitcher.link.throttled", { count: error.retryMinutes })
          : error.message
        : error?.message ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password || link.isPending) return;
    setError(null);
    link.mutate(
      { username: username.trim(), password },
      { onSuccess: onLinked, onError: (cause) => setError(linkErrorOf(cause)) }
    );
  }

  return (
    <AppDialog
      open={Boolean(prompt)}
      onOpenChange={(next) => !next && onClose()}
      variant="adaptive"
      width="lg:max-w-110"
      title={t("roleSwitcher.link.title")}
      description={
        prompt?.role
          ? t("roleSwitcher.link.existingText", {
              username: prompt.username,
              role: tn(`roles.${prompt.role.toLowerCase()}`, { defaultValue: prompt.role }),
            })
          : t("roleSwitcher.link.text")
      }
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={onClose}>
            {t("roleSwitcher.link.cancel")}
          </button>
          <button
            type="submit"
            form="link-account"
            className={dialogButton.primary}
            disabled={!username.trim() || !password || link.isPending}
          >
            {link.isPending ? t("roleSwitcher.link.linking") : t("roleSwitcher.link.submit")}
          </button>
        </>
      }
    >
      <form id="link-account" className="flex flex-col gap-3 pb-1" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-username`} className="text-body-xs text-ink-secondary">
            {t("roleSwitcher.link.username")}
          </label>
          <input
            id={`${id}-username`}
            className={INPUT}
            value={username}
            readOnly={locked}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={error?.field === "username"}
            aria-describedby={error?.field === "username" ? `${id}-error` : undefined}
            onChange={(event) => setUsername(event.target.value)}
          />
          {error?.field === "username" ? (
            <small id={`${id}-error`} className="text-body-xs text-danger">
              {error.message}
            </small>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-password`} className="text-body-xs text-ink-secondary">
            {t("roleSwitcher.link.password")}
          </label>
          <input
            id={`${id}-password`}
            className={INPUT}
            type="password"
            value={password}
            autoComplete="off"
            aria-invalid={error?.field === "password"}
            aria-describedby={error?.field === "password" ? `${id}-error` : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error?.field === "password" ? (
            <small id={`${id}-error`} className="text-body-xs text-danger">
              {error.message}
            </small>
          ) : null}
        </div>
        {message && !error?.field ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-2.5 text-body-sm text-error-text">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
            {message}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}

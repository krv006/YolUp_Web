import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useChangePasswordMutation, useLogoutOtherSessionsMutation, useRevokeSessionMutation, useSessions } from "@/modules/auth";
import { parentLogins } from "@/modules/parent";
import { AppError } from "@/shared/api";
import { formatRelativeShort } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";

const INPUT =
  "h-13 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus focus:bg-surface";

function message(error: unknown, keys: string[]): string {
  if (!(error instanceof AppError)) return error instanceof Error ? error.message : "";
  for (const key of keys) {
    const value = error.fields?.[key];
    if (value) return Array.isArray(value) ? value.join(" ") : String(value);
  }
  return error.message;
}

export function SettingsSecurity() {
  const { t } = useTranslation("parent");
  const change = useChangePasswordMutation();
  const sessions = useSessions();
  const revoke = useRevokeSessionMutation();
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next.length < 8 || !/\d/.test(next)) return setError(t("settings.security.weak"));
    if (next !== repeat) return setError(t("settings.security.mismatch"));
    setError("");
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setRepeat("");
          toast.success(t("settings.security.changed"));
        },
        onError: (cause) => setError(message(cause, ["current_password", "new_password", "detail"])),
      }
    );
  }

  const list = sessions.data ?? [];
  const others = list.filter((item) => !item.isCurrent);

  return (
    <section className="grid grid-cols-2 gap-8 rounded-[24px] bg-surface p-7">
      <h2 className="col-span-2 font-heading text-[20px]/7 font-semibold text-ink">{t("settings.security.title")}</h2>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.security.password")}</small>
        {[
          { key: "current", label: t("settings.security.current"), value: current, set: setCurrent, auto: "current-password" },
          { key: "next", label: t("settings.security.next"), value: next, set: setNext, auto: "new-password", hint: t("settings.security.rule") },
          { key: "repeat", label: t("settings.security.repeat"), value: repeat, set: setRepeat, auto: "new-password" },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
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
            {field.hint ? <small className="text-body-xs text-ink-tertiary">{field.hint}</small> : null}
          </label>
        ))}
        {error ? <small className="text-body-xs text-error-text">{error}</small> : null}
        <button
          type="submit"
          className="flex h-11 w-fit items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50"
          disabled={!current || !next || !repeat || change.isPending}
        >
          <Icon name="key" size={18} />
          {t("settings.security.update")}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("settings.security.sessions")}</small>
        <ul className={`flex flex-col ${sessions.isLoading ? "animate-pulse" : ""}`}>
          {list.map((session) => (
            <li key={session.id} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-icon-secondary">
                <Icon name={parentLogins.deviceKind(session.device) === "computer" ? "laptop" : "smartphone"} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{session.device || t("settings.security.unknownDevice")}</strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {[session.city, session.isCurrent ? t("settings.security.now") : session.lastActive ? formatRelativeShort(session.lastActive) : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
              {session.isCurrent ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-caption-strong text-success-text">
                  <span className="size-1.5 rounded-full bg-success" />
                  {t("settings.security.current")}
                </span>
              ) : (
                <button
                  type="button"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-icon-secondary transition-colors hover:bg-muted disabled:opacity-50"
                  aria-label={t("settings.security.end")}
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(session.id, { onSuccess: () => toast.success(t("settings.security.ended")) })}
                >
                  <Icon name="logout" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {others.length ? (
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
            disabled={logoutOthers.isPending}
            onClick={() => logoutOthers.mutate(undefined, { onSuccess: () => toast.success(t("settings.security.othersEnded")) })}
          >
            <Icon name="logout" size={18} />
            {t("settings.security.endOthers")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

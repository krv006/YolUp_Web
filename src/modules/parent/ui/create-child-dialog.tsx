import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { suggestUsername, tempPassword, usernameAlternatives } from "../lib/parent-family";
import { printCredentials } from "../lib/print-credentials";
import { useCreateChild } from "../model/parent.queries";
import { Celebration, IconTile } from "./child-dialog-parts";
import { CHILD_BUTTON, CHILD_INPUT, CHILD_INPUT_ERROR, DIALOG_TITLE } from "./child-dialog-styles";

export interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credentials {
  name: string;
  username: string;
  password: string;
}

const FORM_ID = "parent-create-child";
const EMPTY = { firstName: "", lastName: "", username: "" };

function randomPool(): number[] {
  return Array.from({ length: 8 }, () => Math.random());
}

function fromPool(pool: number[]): () => number {
  let index = 0;
  return () => pool[index++ % pool.length];
}

function firstError(fields: AppError["fields"], key: string): string {
  const value = fields?.[key];
  return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
}

export function CreateChildDialog({ open, onOpenChange }: CreateChildDialogProps) {
  const { t } = useTranslation("parent");
  const create = useCreateChild({ notify: false });
  const [form, setForm] = useState(EMPTY);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [pool, setPool] = useState(randomPool);
  const [customPassword, setCustomPassword] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [error, setError] = useState<{ field: "username" | "password" | "form"; message: string } | null>(null);
  const [ready, setReady] = useState<Credentials | null>(null);
  const id = useId();
  const compact = useIsCompact();

  const username = usernameEdited ? form.username : suggestUsername(form.firstName, form.lastName);
  const password = customPassword ?? tempPassword(form.firstName, fromPool(pool));
  const usernameError = error?.field === "username";

  function reset() {
    setForm(EMPTY);
    setUsernameEdited(false);
    setPool(randomPool());
    setCustomPassword(null);
    setSuggestions(null);
    setError(null);
    setReady(null);
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  function update(name: keyof typeof EMPTY, value: string) {
    setError(null);
    if (name === "username") {
      setUsernameEdited(true);
      setSuggestions(null);
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function pickUsername(value: string) {
    setUsernameEdited(true);
    setForm((current) => ({ ...current, username: value }));
    setSuggestions(null);
    setError(null);
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("createChild.copied"));
    } catch {
      toast.error(t("children.genericError"));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setError(null);
    create.mutate(
      { first_name: form.firstName.trim(), last_name: form.lastName.trim(), username: username.trim(), password },
      {
        onSuccess: () => setReady({ name, username: username.trim(), password }),
        onError: (cause: Error) => {
          const fields = cause instanceof AppError ? cause.fields : null;
          const loginError = firstError(fields, "username");
          const passwordError = firstError(fields, "password");
          if (loginError) {
            setError({ field: "username", message: t("createChild.taken") });
            setSuggestions(usernameAlternatives(form.firstName, form.lastName, username));
          } else if (passwordError) {
            setError({ field: "password", message: passwordError });
          } else {
            setError({ field: "form", message: cause.message || t("children.genericError") });
          }
        },
      }
    );
  }

  if (ready) {
    const firstName = ready.name.split(" ")[0] || ready.username;
    const rows = [
      { icon: "person", label: t("createChild.username"), value: ready.username },
      { icon: "key", label: t("createChild.password"), value: ready.password },
    ];
    return (
      <AppDialog
        open={open}
        onOpenChange={close}
        variant="fullscreen"
        width="lg:w-130"
        title={<span className="sr-only">{t("createChild.readyTitle")}</span>}
      >
        <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-6 text-center">
          {compact ? <span className="flex-1" /> : null}
          <Celebration icon="how-to-reg" tone="green" />
          <h2 className="font-heading text-[22px]/8 font-semibold text-ink">{t("createChild.readyTitle")}</h2>
          <p className="text-body-sm text-ink-secondary">{t("createChild.readyText", { name: firstName })}</p>
          <dl className="flex w-full flex-col gap-4 rounded-2xl bg-subtle px-4 py-4 text-left">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-icon-secondary">
                  <Icon name={row.icon} size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <dt className="text-caption text-ink-secondary">{row.label}</dt>
                  <dd className="truncate text-title-sm font-semibold text-ink">{row.value}</dd>
                </span>
                <button
                  type="button"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-muted"
                  aria-label={`${t("createChild.copy")}: ${row.label}`}
                  onClick={() => void copy(row.value)}
                >
                  <Icon name="content-copy" size={18} />
                </button>
              </div>
            ))}
          </dl>
          <p className="flex w-full items-center gap-3 rounded-2xl bg-warning-bg px-4 py-3 text-left text-body-sm text-warning-text">
            <Icon name="warning" size={20} className="shrink-0" />
            {t("createChild.warning")}
          </p>
          {compact ? <span className="flex-1" /> : null}
          <div className={`mt-1 flex w-full gap-3 ${compact ? "flex-col" : ""}`}>
            <button
              type="button"
              className={compact ? "flex h-11 items-center justify-center gap-2 text-title-sm font-semibold text-brand" : `${CHILD_BUTTON.secondary} ${CHILD_BUTTON.wide}`}
              onClick={() =>
                compact && typeof navigator.share === "function"
                  ? void navigator
                      .share({ title: t("createChild.printHeading", { name: ready.name || ready.username }), text: rows.map((row) => `${row.label}: ${row.value}`).join("\n") })
                      .catch(() => undefined)
                  : printCredentials({
                  documentTitle: t("createChild.printTitle", { username: ready.username }),
                  heading: t("createChild.printHeading", { name: ready.name || ready.username }),
                  subtitle: t("createChild.printSubtitle"),
                  rows: rows.map(({ label, value }) => ({ label, value })),
                  note: t("createChild.info"),
                })
              }
            >
              {compact ? null : <Icon name="download" size={20} />}
              {compact && typeof navigator.share === "function" ? t("createChild.share") : t("createChild.pdf")}
            </button>
            <button type="button" className={`${CHILD_BUTTON.primary} ${compact ? "h-13 w-full text-title-sm" : CHILD_BUTTON.wide}`} onClick={() => close(false)}>
              {t("createChild.done")}
            </button>
          </div>
        </div>
      </AppDialog>
    );
  }

  const canSubmit = form.firstName.trim() && form.lastName.trim() && username.trim() && password.length >= 8;

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      variant="sheet"
      width="lg:w-150"
      icon={compact ? undefined : <IconTile icon="person-add" tone="green" />}
      title={t("createChild.title")}
      description={t("createChild.description")}
      titleClassName={DIALOG_TITLE}
      footerClassName={compact ? "px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]" : "justify-end px-6 pt-5 pb-6"}
      footer={
        <>
          <button type="button" className={`${CHILD_BUTTON.secondary} ${compact ? CHILD_BUTTON.wide : ""}`} onClick={() => close(false)}>
            {t("createChild.cancel")}
          </button>
          <button type="submit" form={FORM_ID} className={`${CHILD_BUTTON.primary} ${compact ? CHILD_BUTTON.wide : ""}`} disabled={!canSubmit || create.isPending}>
            {t("createChild.submit")}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4 px-1" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-ink">{t("createChild.firstName")}</span>
            <input
              autoFocus
              className={CHILD_INPUT}
              value={form.firstName}
              autoComplete="off"
              onChange={(event) => update("firstName", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-ink">{t("createChild.lastName")}</span>
            <input
              className={CHILD_INPUT}
              value={form.lastName}
              autoComplete="off"
              onChange={(event) => update("lastName", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-username`} className="text-body-sm font-medium text-ink">
            {t("createChild.username")}
          </label>
          <span className="relative">
            <input
              id={`${id}-username`}
              aria-describedby={`${id}-username-hint`}
              className={`${CHILD_INPUT} ${usernameError ? CHILD_INPUT_ERROR : ""}`}
              value={username}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={usernameError}
              onChange={(event) => update("username", event.target.value)}
            />
            {usernameError ? (
              <Icon name="warning-fill" size={20} className="absolute top-1/2 right-4 -translate-y-1/2 text-error-text" />
            ) : null}
          </span>
          <small id={`${id}-username-hint`} className={`text-body-xs ${usernameError ? "text-error-text" : "text-ink-tertiary"}`}>
            {usernameError ? error?.message : t("createChild.usernameHint")}
          </small>
        </div>

        {suggestions?.length ? (
          <div className="-mt-1 flex flex-wrap gap-2">
            {suggestions.map((option) => (
              <button
                key={option}
                type="button"
                className="flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-body-sm font-medium text-ink transition-colors hover:bg-subtle"
                onClick={() => pickUsername(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-password`} className="text-body-sm font-medium text-ink">
            {t("createChild.password")}
          </label>
          <span className="flex items-center gap-2">
            <input
              id={`${id}-password`}
              className={`${CHILD_INPUT} ${error?.field === "password" ? CHILD_INPUT_ERROR : ""}`}
              value={password}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setError(null);
                setCustomPassword(event.target.value);
              }}
            />
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-icon transition-colors hover:bg-subtle"
              aria-label={t("createChild.regenerate")}
              onClick={() => {
                setCustomPassword(null);
                setPool(randomPool());
              }}
            >
              <Icon name="refresh" size={20} />
            </button>
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-icon transition-colors hover:bg-subtle"
              aria-label={t("createChild.copy")}
              onClick={() => void copy(password)}
            >
              <Icon name="content-copy" size={20} />
            </button>
          </span>
          {error?.field === "password" ? <small className="text-body-xs text-error-text">{error.message}</small> : null}
        </div>

        <p className="flex items-center gap-3 rounded-2xl bg-info-bg px-4 py-3 text-body-sm text-info-text">
          <Icon name="info" size={20} className="shrink-0" />
          {t("createChild.info")}
        </p>
        {error?.field === "form" ? <small className="text-body-xs text-error-text">{error.message}</small> : null}
      </form>
    </AppDialog>
  );
}

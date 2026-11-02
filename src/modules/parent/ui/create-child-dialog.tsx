import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useCreateChild } from "../model/parent.queries";

export interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";
const EMPTY = { first_name: "", last_name: "", username: "", password: "" };

export function CreateChildDialog({ open, onOpenChange }: CreateChildDialogProps) {
  const { t } = useTranslation("parent");
  const create = useCreateChild();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY);
      setError("");
    }
  }

  function field(name: keyof typeof EMPTY, label: string, type = "text") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-ink-secondary">{label}</span>
        <input
          className={INPUT}
          type={type}
          value={form[name]}
          autoCapitalize={name === "username" ? "none" : undefined}
          minLength={name === "password" ? 8 : undefined}
          required
          onChange={(event) => {
            setError("");
            setForm((current) => ({ ...current, [name]: event.target.value }));
          }}
        />
      </label>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    create.mutate(form, {
      onSuccess: () => close(false),
      onError: (cause: Error) => setError(cause.message || t("children.genericError")),
    });
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      variant="confirm"
      width="lg:w-120"
      title={t("children.childDialog.title")}
      description={t("children.childDialog.description")}
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          {field("first_name", t("children.childDialog.firstName"))}
          {field("last_name", t("children.childDialog.lastName"))}
        </div>
        {field("username", t("children.childDialog.username"))}
        {field("password", t("children.childDialog.tempPassword"), "password")}
        {error ? <small className="text-body-xs text-error-text">{error}</small> : null}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={dialogButton.secondary} onClick={() => close(false)}>
            {t("children.childDialog.cancel")}
          </button>
          <button type="submit" className={dialogButton.primary} disabled={create.isPending}>
            {t("children.childDialog.submit")}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}

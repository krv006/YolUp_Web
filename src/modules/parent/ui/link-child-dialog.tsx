import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { useRequestChildLink } from "../model/parent.queries";

export interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INPUT =
  "h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface";

export function LinkChildDialog({ open, onOpenChange }: LinkChildDialogProps) {
  const { t } = useTranslation("parent");
  const request = useRequestChildLink();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setValue("");
      setError("");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    setError("");
    request.mutate(value, {
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
      title={t("children.linkDialog.title")}
      description={t("children.linkDialog.description")}
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm text-ink-secondary">{t("children.linkDialog.codeLabel")}</span>
          <input
            autoFocus
            className={INPUT}
            value={value}
            autoCapitalize="none"
            placeholder={t("children.linkDialog.codePlaceholder")}
            onChange={(event) => {
              setError("");
              setValue(event.target.value);
            }}
          />
          {error ? <small className="text-body-xs text-error-text">{error}</small> : null}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={dialogButton.secondary} onClick={() => close(false)}>
            {t("children.linkDialog.cancel")}
          </button>
          <button type="submit" className={dialogButton.primary} disabled={!value.trim() || request.isPending}>
            {t("children.linkDialog.submit")}
          </button>
        </div>
      </form>
    </AppDialog>
  );
}

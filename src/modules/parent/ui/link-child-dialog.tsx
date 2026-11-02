import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import type { ParentLink } from "../api/parent.dto";
import { useRequestChildLink } from "../model/parent.queries";
import { Celebration, IconTile } from "./child-dialog-parts";
import { CHILD_BUTTON, CHILD_INPUT, CHILD_INPUT_ERROR, DIALOG_TITLE } from "./child-dialog-styles";

export interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = "parent-link-child";

export function LinkChildDialog({ open, onOpenChange }: LinkChildDialogProps) {
  const { t } = useTranslation("parent");
  const request = useRequestChildLink({ notify: false });
  const [value, setValue] = useState("");
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [sent, setSent] = useState<ParentLink | null>(null);
  const inputId = useId();
  const compact = useIsCompact();

  function reset() {
    setValue("");
    setError(null);
    setSent(null);
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const login = value.trim();
    if (!login) return;
    setError(null);
    request.mutate(login, {
      onSuccess: (link) => setSent(link),
      onError: (cause: Error) =>
        setError(
          cause instanceof AppError && cause.status === 404
            ? { message: t("linkChild.notFound"), notFound: true }
            : { message: cause.message || t("children.genericError"), notFound: false }
        ),
    });
  }

  if (sent) {
    const linked = sent.status === "approved";
    return (
      <AppDialog
        open={open}
        onOpenChange={close}
        variant={compact ? "fullscreen" : "confirm"}
        width="lg:w-130"
        title={<span className="sr-only">{t(linked ? "linkChild.linkedTitle" : "linkChild.sentTitle")}</span>}
      >
        <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-2 text-center">
          {compact ? <span className="flex-1" /> : null}
          <Celebration icon={linked ? "how-to-reg" : "send"} tone={linked ? "green" : "teal"} />
          <h2 className="font-heading text-[22px]/8 font-semibold text-ink">
            {t(linked ? "linkChild.linkedTitle" : "linkChild.sentTitle")}
          </h2>
          <p className="text-body-sm text-ink-secondary">{t(linked ? "linkChild.linkedText" : "linkChild.sentText")}</p>
          <div className="flex w-full items-center gap-3 rounded-2xl bg-subtle px-4 py-3 text-left">
            <Avatar
              name={sent.student.name}
              src={sent.student.avatarUrl ?? undefined}
              size="sm"
              className="shrink-0 [&_.avatar]:size-11"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">{sent.student.name}</strong>
              <small className="truncate text-body-xs text-ink-secondary">@{sent.student.username}</small>
            </span>
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-caption-strong ${
                linked ? "bg-success-bg text-success-text" : "bg-accent-teal-bg text-accent-teal-fg"
              }`}
            >
              <Icon name={linked ? "check-circle" : "schedule"} size={14} />
              {t(linked ? "linkChild.chipLinked" : "linkChild.chipPending")}
            </span>
          </div>
          {compact ? <span className="flex-1" /> : null}
          <div className={`mt-2 flex w-full gap-3 pb-4 ${compact ? "flex-col" : ""}`}>
            <button
              type="button"
              className={compact ? "h-11 text-title-sm font-semibold text-brand" : `${CHILD_BUTTON.secondary} ${CHILD_BUTTON.wide}`}
              onClick={reset}
            >
              {t("linkChild.more")}
            </button>
            <button type="button" className={`${CHILD_BUTTON.primary} ${compact ? "h-13 w-full text-title-sm" : CHILD_BUTTON.wide}`} onClick={() => close(false)}>
              {t("linkChild.done")}
            </button>
          </div>
        </div>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      variant={compact ? "sheet" : "confirm"}
      width="lg:w-140"
      icon={compact ? undefined : <IconTile icon="link" />}
      title={t("linkChild.title")}
      description={t("linkChild.description")}
      titleClassName={DIALOG_TITLE}
      footerClassName={compact ? "px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]" : "justify-end px-6 pt-5 pb-6"}
      footer={
        <>
          <button type="button" className={`${CHILD_BUTTON.secondary} ${compact ? CHILD_BUTTON.wide : ""}`} onClick={() => close(false)}>
            {t("linkChild.cancel")}
          </button>
          <button type="submit" form={FORM_ID} className={`${CHILD_BUTTON.primary} ${compact ? CHILD_BUTTON.wide : ""}`} disabled={!value.trim() || request.isPending}>
            {error ? t("linkChild.retry") : t("linkChild.submit")}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4 px-1" onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-body-sm font-medium text-ink">
            {t("linkChild.label")}
          </label>
          <span className="relative">
            <input
              id={inputId}
              aria-describedby={`${inputId}-hint`}
              autoFocus
              className={`${CHILD_INPUT} ${error ? CHILD_INPUT_ERROR : ""}`}
              value={value}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(error)}
              placeholder={t("linkChild.placeholder")}
              onChange={(event) => {
                setError(null);
                setValue(event.target.value);
              }}
            />
            {error ? (
              <Icon name="warning-fill" size={20} className="absolute top-1/2 right-4 -translate-y-1/2 text-error-text" />
            ) : null}
          </span>
          <small id={`${inputId}-hint`} className={`text-body-xs ${error ? "text-error-text" : "text-ink-tertiary"}`}>
            {error ? error.message : t("linkChild.hint")}
          </small>
        </div>
        {error?.notFound ? (
          <p className="flex items-start gap-3 rounded-2xl bg-warning-bg px-4 py-3 text-body-sm text-warning-text">
            <Icon name="info" size={20} className="mt-px shrink-0" />
            {t("linkChild.notFoundNote")}
          </p>
        ) : null}
      </form>
    </AppDialog>
  );
}

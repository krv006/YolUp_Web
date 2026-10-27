import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

export interface RemindDialogProps {
  open: boolean;
  count: number;
  title: string;
  due: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { message: string; notifyParents: boolean }) => void;
}

export function RemindDialog({
  open,
  count,
  title,
  due,
  pending = false,
  onOpenChange,
  onConfirm,
}: RemindDialogProps) {
  const { t } = useTranslation("homework");
  const [withParents, setWithParents] = useState(true);
  const isCompact = useIsCompact();
  const [message, setMessage] = useState("");

  const text = message || t("remindDialog.defaultMessage", { title, due });

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      title={t("remindDialog.title")}
      description={t("remindDialog.description", { count })}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={`${dialogButton.secondary} max-lg:h-13 max-lg:border-line-strong max-lg:text-title max-lg:font-semibold`}
            onClick={() => onOpenChange(false)}
          >
            {t("remindDialog.cancel")}
          </button>
          <button
            type="button"
            className={`${dialogButton.primary} max-lg:h-13 max-lg:text-title max-lg:font-semibold`}
            disabled={pending}
            onClick={() => onConfirm({ message: text, notifyParents: withParents })}
          >
            {t("remindDialog.submit")}
          </button>
        </div>
      }
    >
      <label className="flex flex-col gap-2 max-lg:-mt-0.5">
        <span className="text-body-xs text-ink-secondary max-lg:text-body-sm max-lg:leading-4.5 max-lg:text-ink">{t("remindDialog.message")}</span>
        <textarea
          className="min-h-25 w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none focus:border-focus focus:bg-surface max-lg:h-28 max-lg:rounded-lg max-lg:px-4.5 max-lg:focus:bg-subtle"
          value={text}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <span className="flex items-center gap-3 max-lg:px-4 max-lg:pt-3 max-lg:pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand max-lg:size-10 max-lg:rounded-lg max-lg:bg-accent-violet-bg max-lg:text-ink">
          <Icon name="person" size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title-sm text-ink max-lg:text-title">
            {t("remindDialog.parents")}
          </strong>
          <small className="truncate text-body-xs text-ink-tertiary max-lg:text-body-sm max-lg:text-ink-secondary">
            {t("remindDialog.parentsHint")}
          </small>
        </span>
        <Switch
          size={isCompact ? "lg" : "default"}
          checked={withParents}
          onCheckedChange={setWithParents}
          aria-label={t("remindDialog.parents")}
        />
      </span>

      <p className="text-body-xs text-ink-tertiary max-lg:text-caption">{t("remindDialog.rate")}</p>
    </AppDialog>
  );
}

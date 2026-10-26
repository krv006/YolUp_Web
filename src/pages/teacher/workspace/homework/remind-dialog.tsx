import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const [message, setMessage] = useState("");

  const text = message || t("remindDialog.defaultMessage", { title, due });

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("remindDialog.title")}
      description={t("remindDialog.description", { count })}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("remindDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending}
            onClick={() => onConfirm({ message: text, notifyParents: withParents })}
          >
            {t("remindDialog.submit")}
          </button>
        </div>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="text-body-xs text-ink-secondary">{t("remindDialog.message")}</span>
        <textarea
          className="min-h-25 w-full resize-none rounded-md border border-transparent bg-subtle px-4 py-3 text-body text-ink outline-none focus:border-focus focus:bg-surface"
          value={text}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <span className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
          <Icon name="person" size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title-sm text-ink">
            {t("remindDialog.parents")}
          </strong>
          <small className="truncate text-body-xs text-ink-tertiary">
            {t("remindDialog.parentsHint")}
          </small>
        </span>
        <Switch
          checked={withParents}
          onCheckedChange={setWithParents}
          aria-label={t("remindDialog.parents")}
        />
      </span>

      <p className="text-body-xs text-ink-tertiary">{t("remindDialog.rate")}</p>
    </AppDialog>
  );
}

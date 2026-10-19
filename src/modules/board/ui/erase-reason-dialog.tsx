import { useTranslation } from "react-i18next";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";

const PRESET_KEYS = ["wrongAnswer", "offTopic", "cleanup"] as const;

export interface EraseReasonDialogProps {
  open: boolean;
  pending: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EraseReasonDialog({
  open,
  pending,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}: EraseReasonDialogProps) {
  const { t } = useTranslation("board");
  const presets = PRESET_KEYS.map((key) => t(`eraseDialog.reasons.${key}`));
  const custom = Boolean(reason) && !presets.includes(reason);

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onCancel())}
      variant="confirm"
      title={t("eraseDialog.title")}
      description={t("eraseDialog.description")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={onCancel}>
            {t("eraseDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.danger}
            disabled={pending || !reason.trim()}
            onClick={onConfirm}
          >
            {t("eraseDialog.confirm")}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`flex h-9 items-center rounded-full border px-3 text-label-strong transition-colors ${
              reason === preset
                ? "border-action bg-action-subtle text-action"
                : "border-line bg-surface text-ink-secondary hover:bg-subtle hover:text-ink"
            }`}
            onClick={() => onReasonChange(preset)}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          className={`flex h-9 items-center rounded-full border px-3 text-label-strong transition-colors ${
            custom
              ? "border-action bg-action-subtle text-action"
              : "border-line bg-surface text-ink-secondary hover:bg-subtle hover:text-ink"
          }`}
          onClick={() => onReasonChange(custom ? reason : " ")}
        >
          {t("eraseDialog.reasons.other")}
        </button>
      </div>

      {custom ? (
        <input
          autoFocus
          className="h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-body text-ink outline-none focus:border-focus"
          value={reason.trimStart()}
          placeholder={t("eraseDialog.reasonLabel")}
          onChange={(event) => onReasonChange(event.target.value || " ")}
        />
      ) : null}
    </AppDialog>
  );
}

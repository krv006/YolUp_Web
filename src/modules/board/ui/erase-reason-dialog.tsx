import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileAlertDialog } from "@/shared/ui/mobile-alert-dialog";
import { MobileRadio } from "@/shared/ui/mobile-fields";

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
  const isCompact = useIsCompact();
  const presets = PRESET_KEYS.map((key) => t(`eraseDialog.reasons.${key}`));
  const custom = Boolean(reason) && !presets.includes(reason);
  const options = [
    ...presets.map((label) => ({ label, custom: false })),
    { label: t("eraseDialog.reasons.other"), custom: true },
  ];

  const radio = (active: boolean) => (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
        active ? "border-brand" : "border-line-strong"
      }`}
    >
      {active ? <span className="size-2.5 rounded-full bg-brand" /> : null}
    </span>
  );

  const customInput = custom ? (
    <input
      autoFocus
      className="h-12 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
      value={reason.trimStart()}
      placeholder={t("eraseDialog.reasonPlaceholder")}
      onChange={(event) => onReasonChange(event.target.value || " ")}
    />
  ) : null;

  if (isCompact)
    return (
      <MobileAlertDialog
        open={open}
        onOpenChange={(next) => (next ? undefined : onCancel())}
        icon="delete-fill"
        tone="danger"
        title={t("eraseDialog.title")}
        description={t("eraseDialog.description")}
        cancelLabel={t("eraseDialog.cancel")}
        confirmLabel={t("eraseDialog.confirm")}
        confirmTone="danger"
        pending={pending || !reason.trim()}
        className="top-[calc(50%+24px)]"
        titleClassName="text-title-lg leading-[26px] font-medium"
        onCancel={onCancel}
        onConfirm={onConfirm}
      >
        <span className="mt-[15px] text-caption-strong text-ink-secondary uppercase">
          {t("eraseDialog.reasonLabel")}
        </span>
        <div className="mt-[13px] mb-0.5 flex flex-col gap-1" role="radiogroup">
          {options.map((option) => {
            const active = option.custom ? custom : reason === option.label;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={active}
                className={`flex h-16 items-center gap-6 rounded-lg pr-6 pl-[23px] text-left transition-colors ${
                  active ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                onClick={() => onReasonChange(option.custom ? (custom ? reason : " ") : option.label)}
              >
                <MobileRadio checked={active} />
                <span className="min-w-0 flex-1 truncate text-label-lg text-ink">{option.label}</span>
              </button>
            );
          })}
        </div>
        {customInput}
      </MobileAlertDialog>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onCancel())}
      variant="confirm"
      layout="stacked"
      width="lg:w-85"
      icon={
        <span className="grid size-12 place-items-center rounded-md bg-danger-bg text-danger">
          <Icon name="delete" size={22} />
        </span>
      }
      title={t("eraseDialog.title")}
      description={t("eraseDialog.description")}
      footer={
        <>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
            onClick={onCancel}
          >
            {t("eraseDialog.cancel")}
          </button>
          <button
            type="button"
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-danger-bg px-4 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
            disabled={pending || !reason.trim()}
            onClick={onConfirm}
          >
            {t("eraseDialog.confirm")}
          </button>
        </>
      }
    >
      <span className="text-overline text-ink-tertiary uppercase">
        {t("eraseDialog.reasonLabel")}
      </span>

      <div className="flex flex-col gap-1" role="radiogroup">
        {options.map((option) => {
          const active = option.custom ? custom : reason === option.label;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={active}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                active ? "bg-subtle" : "hover:bg-subtle"
              }`}
              onClick={() => onReasonChange(option.custom ? (custom ? reason : " ") : option.label)}
            >
              {radio(active)}
              <span className="min-w-0 flex-1 truncate text-title-sm text-ink">{option.label}</span>
            </button>
          );
        })}
      </div>

      {customInput}
    </AppDialog>
  );
}

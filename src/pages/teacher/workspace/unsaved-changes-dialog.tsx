import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { MobileAlertDialog } from "@/shared/ui/mobile-alert-dialog";

export interface UnsavedChangesDialogProps {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({
  open,
  count,
  onOpenChange,
  onLeave,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation("quiz");
  const isCompact = useIsCompact();

  if (isCompact)
    return (
      <MobileAlertDialog
        open={open}
        onOpenChange={onOpenChange}
        icon="edit-note"
        title={t("unsaved.title")}
        description={t("unsaved.description", { count })}
        cancelLabel={t("unsaved.leave")}
        confirmLabel={t("unsaved.stay")}
        onCancel={() => {
          onOpenChange(false);
          onLeave();
        }}
        onConfirm={() => onOpenChange(false)}
      />
    );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-85 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl bg-surface p-6 text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="edit-note" size={26} />
          </span>

          <span className="flex flex-col gap-2">
            <DialogPrimitive.Title className="font-heading text-h2 text-ink">
              {t("unsaved.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-body-sm text-ink-secondary">
              {t("unsaved.description", { count })}
            </DialogPrimitive.Description>
          </span>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-full border border-line bg-surface text-button text-ink transition-colors hover:bg-subtle"
              onClick={() => {
                onOpenChange(false);
                onLeave();
              }}
            >
              {t("unsaved.leave")}
            </button>
            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-full bg-brand text-button text-ink-inverse transition-colors hover:bg-brand-strong"
              onClick={() => onOpenChange(false)}
            >
              {t("unsaved.stay")}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

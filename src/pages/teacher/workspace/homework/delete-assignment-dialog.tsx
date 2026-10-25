import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/shared/ui/icon";

export interface DeleteAssignmentDialogProps {
  open: boolean;
  count: number;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteAssignmentDialog({
  open,
  count,
  pending = false,
  onOpenChange,
  onConfirm,
}: DeleteAssignmentDialogProps) {
  const { t } = useTranslation("homework");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-82 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-2xl bg-surface px-6 py-7 text-center text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-danger-bg text-danger">
            <Icon name="logout" size={24} />
          </span>

          <span className="flex flex-col gap-2">
            <DialogPrimitive.Title className="font-heading text-h2 text-ink">
              {t("deleteDialog.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-body-sm text-ink-secondary">
              {t("deleteDialog.description", { count })}
            </DialogPrimitive.Description>
          </span>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-danger-bg text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
            disabled={pending}
            onClick={onConfirm}
          >
            {t("deleteDialog.confirm")}
          </button>

          <button
            type="button"
            className="text-button text-brand transition-colors hover:text-brand-strong"
            onClick={() => onOpenChange(false)}
          >
            {t("deleteDialog.cancel")}
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

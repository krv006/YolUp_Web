import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: string;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  pending?: boolean;
  tone?: "danger" | "brand";
  confirmIcon?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

const TONES = {
  danger: { icon: "bg-danger-bg text-error-text", button: "bg-danger-bg text-danger" },
  brand: { icon: "bg-brand-subtle text-brand", button: "bg-brand text-on-action" },
} as const;

export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending = false,
  tone = "danger",
  confirmIcon,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const isCompact = useIsCompact();

  function cancel() {
    onOpenChange(false);
    onCancel?.();
  }

  if (isCompact)
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[86dvh] w-[calc(100%-32px)] max-w-82.5 -translate-x-1/2 -translate-y-1/2 flex-col items-center overflow-y-auto rounded-2xl bg-surface px-6 pt-6 pb-6.5 text-center text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <span className={`grid size-14 shrink-0 place-items-center rounded-full ${TONES[tone].icon}`}>
              <Icon name={icon} size={24} />
            </span>
            <DialogPrimitive.Title className="mt-4 px-1 text-title-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1.5 px-1 text-body-sm text-ink-secondary">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            {children ? <div className="mt-4 w-full text-left">{children}</div> : null}
            <button
              type="button"
              className={`mt-3.5 flex h-13 w-full shrink-0 items-center justify-center gap-2 rounded-full text-title font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 ${TONES[tone].button}`}
              disabled={pending}
              onClick={onConfirm}
            >
              {confirmIcon ? <Icon name={confirmIcon} size={20} /> : null}
              {confirmLabel}
            </button>
            <button
              type="button"
              className="mt-3 flex h-12 w-full shrink-0 items-center justify-center text-title font-semibold text-brand-strong transition-opacity hover:opacity-80"
              onClick={cancel}
            >
              {cancelLabel}
            </button>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-130"
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={cancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "brand" ? dialogButton.primary : dialogButton.danger}
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </AppDialog>
  );
}

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/shared/ui/icon";

export interface MobileAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: string;
  tone?: "brand" | "danger";
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  confirmTone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  className?: string;
  titleClassName?: string;
}

const TILE = {
  brand: "bg-brand-subtle text-brand",
  danger: "bg-danger-bg text-error-text",
};

const CONFIRM = {
  primary: "bg-brand text-on-action hover:bg-brand-strong",
  danger: "bg-danger-bg text-danger hover:opacity-85",
};

export function MobileAlertDialog({
  open,
  onOpenChange,
  icon,
  tone = "brand",
  title,
  description,
  children,
  cancelLabel,
  confirmLabel,
  confirmTone = "primary",
  pending = false,
  onConfirm,
  onCancel,
  className = "top-[calc(50%-22px)]",
  titleClassName = "text-h2",
}: MobileAlertDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className={`fixed ${className} left-1/2 z-50 flex max-h-[86dvh] w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl bg-surface px-5 pt-6 pb-6 font-body text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`}>
          <span className={`grid size-13 shrink-0 place-items-center rounded-lg ${TILE[tone]}`}>
            <Icon name={icon} size={26} />
          </span>
          <DialogPrimitive.Title className={`mt-[13px] font-heading text-ink ${titleClassName}`}>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-[13px] text-body-sm text-ink-secondary">
            {description}
          </DialogPrimitive.Description>
          {children}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full border border-line-strong bg-surface text-button text-ink transition-colors hover:bg-subtle"
              onClick={() => (onCancel ? onCancel() : onOpenChange(false))}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`flex h-11 items-center justify-center rounded-full text-button transition-colors disabled:opacity-50 ${CONFIRM[confirmTone]}`}
              disabled={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

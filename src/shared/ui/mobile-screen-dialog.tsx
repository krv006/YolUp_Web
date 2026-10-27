import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, mobileRoundButton } from "@/shared/ui/mobile-page";

export interface MobileScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  closeIcon?: "close" | "chevron-left";
  onClose?: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}

export function MobileScreenDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  closeIcon = "close",
  onClose,
  action,
  footer,
  children,
  bodyClassName = "",
}: MobileScreenDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-canvas bg-auth-gradient font-body text-ink outline-none"
          onEscapeKeyDown={(event) => {
            if (!onClose) return;
            event.preventDefault();
            onClose();
          }}
        >
          <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0 ${bodyClassName}`}>
            <header className="flex h-11 items-center gap-3">
              <button
                type="button"
                className={mobileRoundButton}
                aria-label={closeLabel}
                onClick={() => (onClose ? onClose() : onOpenChange(false))}
              >
                <Icon name={closeIcon} size={22} />
              </button>
              <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              {action ?? <span className="size-11 shrink-0" aria-hidden="true" />}
            </header>
            <DialogPrimitive.Description className="sr-only">{description ?? title}</DialogPrimitive.Description>
            {children}
          </div>
          {footer ? <MobileActionBar>{footer}</MobileActionBar> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

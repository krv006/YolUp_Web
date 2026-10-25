import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export interface ModalCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function ModalCard({
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  children,
  footer,
  width = "max-w-130",
}: ModalCardProps) {
  const { t } = useTranslation("common");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={`fixed top-1/2 left-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-32px)] ${width} -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-surface px-4 pt-2.5 pb-4 text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`}
        >
          <span
            className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted"
            aria-hidden="true"
          />

          <div className="flex shrink-0 items-center gap-3 pt-4">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogPrimitive.Title className="truncate font-heading text-h2 text-ink">
                {title}
              </DialogPrimitive.Title>
              {subtitle ? (
                <small className="truncate text-body-xs text-ink-tertiary">{subtitle}</small>
              ) : null}
            </span>
            <DialogPrimitive.Close
              className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
              aria-label={t("actions.close", { defaultValue: "Yopish" })}
            >
              <Icon name="close" size={18} />
            </DialogPrimitive.Close>
          </div>

          {description ? (
            <DialogPrimitive.Description className="shrink-0 pt-4.5 text-body-sm text-ink-secondary">
              {description}
            </DialogPrimitive.Description>
          ) : null}

          {children ? (
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-1 pt-4.5">
              {children}
            </div>
          ) : null}

          {footer ? <div className="shrink-0 pt-7">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const modalButton = {
  primary:
    "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40 disabled:hover:bg-brand",
  secondary:
    "flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle",
  danger:
    "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-danger-bg px-5 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50",
};

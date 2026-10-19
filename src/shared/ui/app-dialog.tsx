import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export type AppDialogVariant = "sheet" | "fullscreen" | "confirm";

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sheet: bottom sheet on phones · fullscreen: whole screen on phones · confirm: centred card everywhere */
  variant?: AppDialogVariant;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}

const SHELL =
  "fixed z-50 flex flex-col bg-surface text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0";

const PLACEMENT: Record<AppDialogVariant, string> = {
  sheet:
    "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[86vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:border-line lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
  fullscreen:
    "inset-0 h-dvh w-full rounded-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[86vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:border-line lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
  confirm:
    "top-1/2 left-1/2 max-h-[86dvh] w-[calc(100%-40px)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 lg:max-w-[420px]",
};

export function AppDialog({
  open,
  onOpenChange,
  variant = "sheet",
  title,
  description,
  children,
  footer,
  width = "lg:w-[560px]",
}: AppDialogProps) {
  const { t } = useTranslation("common");
  const closeable = variant !== "confirm";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={`${SHELL} ${PLACEMENT[variant]} ${variant === "confirm" ? "" : width}`}
        >
          {variant === "sheet" ? (
            <span
              className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted lg:hidden"
              aria-hidden="true"
            />
          ) : null}

          <div
            className={`flex shrink-0 items-start gap-3 px-5 pt-5 ${
              variant === "fullscreen" ? "lg:px-6" : "lg:px-6"
            } ${description ? "pb-3" : "pb-4"}`}
          >
            {variant === "fullscreen" ? (
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-subtle lg:hidden"
                onClick={() => onOpenChange(false)}
                aria-label={t("actions.close", { defaultValue: "Yopish" })}
              >
                <Icon name="add" size={18} className="rotate-45" />
              </button>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DialogPrimitive.Title className="font-heading text-h3 text-ink">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-body-sm text-ink-secondary">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>

            {closeable ? (
              <button
                type="button"
                className={`grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-subtle ${
                  variant === "fullscreen" ? "hidden lg:grid" : "hidden lg:grid"
                }`}
                onClick={() => onOpenChange(false)}
                aria-label={t("actions.close", { defaultValue: "Yopish" })}
              >
                <Icon name="add" size={18} className="rotate-45" />
              </button>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 lg:px-6">
            {children}
          </div>

          {footer ? (
            <div
              className={`flex shrink-0 items-center justify-end gap-3 px-5 py-4 lg:px-6 ${
                variant === "confirm" ? "pt-0" : "border-t border-line"
              }`}
            >
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const dialogButton = {
  primary:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-action px-5 text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-50 lg:flex-none",
  secondary:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-label-strong text-ink transition-colors hover:bg-subtle lg:flex-none",
  danger:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-error px-5 text-label-strong text-white transition-opacity hover:opacity-90 disabled:opacity-50 lg:flex-none",
};

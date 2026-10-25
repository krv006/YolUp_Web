import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

export type AppDialogVariant = "sheet" | "fullscreen" | "confirm" | "panel";

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sheet: bottom sheet on phones · fullscreen: whole screen on phones · confirm: centred card everywhere · panel: right-hand sheet */
  variant?: AppDialogVariant;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
  /** stacked: ikonka sarlavha ustida turadi. */
  layout?: "inline" | "stacked";
}

const SHELL =
  "fixed z-50 flex flex-col bg-surface text-ink shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0";

const PLACEMENT: Record<AppDialogVariant, string> = {
  sheet:
    "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[86vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:border-line lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
  fullscreen:
    "inset-0 h-dvh w-full rounded-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[86vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border lg:border-line lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
  confirm:
    "top-1/2 left-1/2 max-h-[86dvh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  panel:
    "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:rounded-t-none lg:rounded-l-2xl lg:data-[state=closed]:slide-out-to-right lg:data-[state=open]:slide-in-from-right",
};

export function AppDialog({
  icon,
  open,
  onOpenChange,
  variant = "sheet",
  title,
  description,
  children,
  footer,
  width = "lg:w-130",
  layout = "inline",
}: AppDialogProps) {
  const { t } = useTranslation("common");

  const titleBlock = (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <DialogPrimitive.Title className="font-heading text-h2 text-ink">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-body-sm text-ink-secondary">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={`${SHELL} ${PLACEMENT[variant]} ${width}`}
        >
          <span
            className={`mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted ${
              variant === "panel" ? "lg:hidden" : ""
            }`}
            aria-hidden="true"
          />

          <div
            className={`flex shrink-0 gap-3 px-4 pt-4 ${
              layout === "stacked" ? "flex-col items-start" : "items-center"
            }`}
          >
            <div className="flex w-full items-center gap-3">
              {icon ? <span className="shrink-0">{icon}</span> : null}
              {layout === "stacked" ? <span className="min-w-0 flex-1" /> : titleBlock}

              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
                onClick={() => onOpenChange(false)}
                aria-label={t("actions.close", { defaultValue: "Yopish" })}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {layout === "stacked" ? titleBlock : null}
          </div>

          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-5 pt-4.5 pb-1">
            {children}
          </div>

          {footer ? (
            <div className="flex shrink-0 items-center gap-3 px-4 pt-6 pb-4">{footer}</div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const dialogButton = {
  primary:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40 disabled:hover:bg-brand",
  secondary:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle",
  danger:
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-danger-bg px-5 text-button text-danger transition-opacity hover:opacity-85 disabled:opacity-50",
};

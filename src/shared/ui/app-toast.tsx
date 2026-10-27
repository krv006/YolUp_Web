import { X } from "lucide-react";
import { toast } from "sonner";

export interface AppToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export function showErrorToast({ title, description, duration = 5000 }: AppToastOptions) {
  return toast.custom(
    () => (
      <div className="relative w-full overflow-hidden rounded-md bg-danger-bg px-4 pt-4 pb-2.5 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-inverse">
            <span className="grid size-5 place-items-center rounded-full bg-error-text text-surface-inverse">
              <X size={12} strokeWidth={3} />
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="font-heading text-title-lg text-error-text">{title}</strong>
            {description ? (
              <span className="text-body-sm text-ink-secondary">{description}</span>
            ) : null}
          </span>
        </div>

        <i
          className="absolute inset-x-0 bottom-0 h-2.5 origin-left bg-error-text not-italic"
          style={{ animation: `app-toast-progress ${duration}ms linear forwards` }}
          aria-hidden="true"
        />
      </div>
    ),
    { duration }
  );
}

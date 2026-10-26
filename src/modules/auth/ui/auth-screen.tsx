import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Eye, EyeOff, HelpCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AuthShell } from "@/shared/ui/auth-shell";

export interface AuthScreenProps {
  onBack?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  notice?: ReactNode;
  children?: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}

export function AuthScreen({
  onBack,
  title,
  description,
  notice,
  children,
  action,
  footer,
}: AuthScreenProps) {
  const { t } = useTranslation("auth");
  const isCompact = useIsCompact();

  if (!isCompact)
    return (
      <AuthShell title={title} description={description} action={action} footer={footer} notice={notice}>
        {children}
      </AuthShell>
    );

  return (
    <main className="flex min-h-dvh flex-col bg-canvas px-5 pt-4 pb-7">
      <div className="flex h-10 shrink-0 items-center">
        {onBack ? (
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
            aria-label={t("mobile.back")}
            onClick={onBack}
          >
            <ArrowLeft size={22} />
          </button>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
        {notice ? <div className="mt-3">{notice}</div> : null}

        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          {title ? (
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-h1 text-ink">{title}</h1>
              {description ? <p className="text-body text-ink-secondary">{description}</p> : null}
            </div>
          ) : null}
          {children}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-4">
          {action}
          {footer ? <p className="text-body-sm text-ink-secondary">{footer}</p> : null}
        </div>
      </div>
    </main>
  );
}

export interface AuthButtonProps {
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  form?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function AuthButton({
  type = "button",
  variant = "primary",
  loading = false,
  loadingLabel,
  disabled = false,
  form,
  onClick,
  children,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      form={form}
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex h-14.5 w-full items-center justify-center gap-2 rounded-full text-title transition-colors disabled:opacity-60 ${
        variant === "primary"
          ? "bg-action text-on-action hover:bg-action-hover active:bg-action-pressed"
          : "border border-line bg-surface text-ink hover:bg-subtle"
      }`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { invalid = false, trailing, leading, className, ...props },
  ref
) {
  return (
    <span
      className={`flex h-14.5 w-full items-center gap-2 rounded-full border px-5 transition-colors ${
        invalid
          ? "border-error-text bg-surface"
          : "border-transparent bg-subtle focus-within:border-focus"
      } ${className ?? ""}`}
    >
      {leading}
      <input
        ref={ref}
        className={`h-full min-w-0 flex-1 bg-transparent text-body outline-none ${
          invalid
            ? "text-error-text placeholder:text-error-text"
            : "text-ink placeholder:text-ink-tertiary"
        }`}
        {...props}
      />
      {trailing}
    </span>
  );
});

export interface AuthPasswordFieldProps extends AuthFieldProps {
  visible: boolean;
  onToggle: () => void;
}

export const AuthPasswordField = forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  function AuthPasswordField({ visible, onToggle, invalid, ...props }, ref) {
    const { t } = useTranslation("auth");

    return (
      <AuthField
        ref={ref}
        type={visible ? "text" : "password"}
        invalid={invalid}
        trailing={
          <button
            type="button"
            className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
              invalid ? "text-error-text" : "text-ink-tertiary hover:text-ink"
            }`}
            aria-label={visible ? t("form.hidePassword") : t("form.showPassword")}
            onClick={onToggle}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...props}
      />
    );
  }
);

export interface AuthPhoneFieldProps extends AuthFieldProps {
  hint?: string;
}

export const AuthPhoneField = forwardRef<HTMLInputElement, AuthPhoneFieldProps>(
  function AuthPhoneField({ hint, ...props }, ref) {
    return (
      <AuthField
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        leading={
          <span className="flex shrink-0 items-center gap-1 pr-2 text-title text-ink">
            UZ
            <ChevronDown size={16} className="text-ink-secondary" />
          </span>
        }
        trailing={
          hint ? (
            <span className="shrink-0 text-ink-tertiary" title={hint}>
              <HelpCircle size={18} />
            </span>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

export function AuthFieldError({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 text-caption text-error-text" role="alert">
      {children}
    </p>
  );
}

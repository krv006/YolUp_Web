import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Eye, EyeOff, HelpCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AuthShell } from "@/shared/ui/auth-shell";
import { UZ_PHONE_LENGTH, formatUzPhone } from "../lib/uz-phone";

export type AuthScreenLayout = "top" | "spaced" | "center";

export interface AuthScreenProps {
  onBack?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  notice?: ReactNode;
  hero?: ReactNode;
  layout?: AuthScreenLayout;
  children?: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}

const TOP_SPACE: Record<AuthScreenLayout, string> = {
  top: "h-9",
  spaced: "h-47",
  center: "h-43",
};

export function AuthScreen({
  onBack,
  title,
  description,
  notice,
  hero,
  layout = "top",
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
    <main className="flex min-h-dvh flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-2 pb-20 font-body text-ink">
      <div className="flex h-10 shrink-0 items-center">
        {onBack ? (
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-subtle"
            aria-label={t("mobile.back")}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
        {notice ? <div className="mt-3 shrink-0">{notice}</div> : null}

        <span className={`${TOP_SPACE[layout]} min-h-6`} aria-hidden="true" />

        {layout === "center" ? (
          <div className="flex shrink-0 flex-col items-center gap-3 text-center">
            {hero}
            {title ? <h1 className="font-heading text-[22px]/7 font-medium text-ink">{title}</h1> : null}
            {description ? (
              <p className="px-4 text-body text-ink-secondary">{description}</p>
            ) : null}
          </div>
        ) : title ? (
          <div className="flex shrink-0 flex-col gap-3">
            <h1 className="max-w-85 font-heading text-display font-medium text-ink">{title}</h1>
            {description ? (
              <p className="text-body whitespace-pre-line text-ink-secondary">{description}</p>
            ) : null}
          </div>
        ) : null}

        {children ? (
          <div className={`${layout === "spaced" ? "mt-3" : "mt-7.5"} shrink-0`}>{children}</div>
        ) : null}

        <span className="min-h-8 flex-1" aria-hidden="true" />

        <div className="flex shrink-0 flex-col items-center gap-4">
          {action}
          {footer ? (
            <p className="text-body-sm text-ink">{footer}</p>
          ) : (
            <span className={layout === "center" ? "h-3" : "h-5"} aria-hidden="true" />
          )}
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
      className={`flex h-14.5 w-full items-center justify-center gap-2 rounded-2xl text-title transition-colors lg:rounded-full ${
        loading ? "disabled:opacity-80" : "disabled:opacity-45"
      } ${
        variant === "primary"
          ? "bg-action text-on-action enabled:hover:bg-action-hover enabled:active:bg-action-pressed"
          : "border border-line-strong bg-surface text-ink hover:bg-subtle"
      }`}
    >
      {loading ? <Loader2 size={18} className="hidden animate-spin lg:block" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  invalidStyle?: "full" | "border";
  trailing?: ReactNode;
  leading?: ReactNode;
  label?: ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { invalid = false, invalidStyle = "full", trailing, leading, label, className, ...props },
  ref
) {
  const redText = invalid && invalidStyle === "full";
  const box = (
    <span
      className={`flex h-14 w-full items-center gap-2 rounded-2xl border px-5 transition-colors lg:h-14.5 lg:rounded-full ${
        invalid
          ? "border-error-text bg-subtle lg:bg-surface"
          : "border-transparent bg-subtle focus-within:border-focus"
      } ${className ?? ""}`}
    >
      {leading}
      <input
        ref={ref}
        className={`h-full min-w-0 flex-1 bg-transparent text-body font-medium outline-none placeholder:text-body-sm placeholder:font-normal lg:font-normal lg:placeholder:text-body ${
          redText
            ? "text-error-text placeholder:text-error-text"
            : "text-ink placeholder:text-ink-secondary"
        }`}
        {...props}
      />
      {trailing}
    </span>
  );

  if (!label) return box;

  return (
    <label className="flex w-full flex-col gap-1">
      <span className="text-body-sm text-ink">{label}</span>
      {box}
    </label>
  );
});

export interface AuthPasswordFieldProps extends AuthFieldProps {
  visible: boolean;
  onToggle: () => void;
}

export const AuthPasswordField = forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  function AuthPasswordField(
    { visible, onToggle, invalid, invalidStyle = "full", ...props },
    ref
  ) {
    const { t } = useTranslation("auth");
    const redIcon = invalid && invalidStyle === "full";

    return (
      <AuthField
        ref={ref}
        type={visible ? "text" : "password"}
        invalid={invalid}
        invalidStyle={invalidStyle}
        trailing={
          <button
            type="button"
            className={`-mr-2 grid size-8 shrink-0 place-items-center rounded-full transition-colors lg:mr-0 ${
              redIcon ? "text-error-text" : "text-ink-secondary hover:text-ink lg:text-ink-tertiary"
            }`}
            aria-label={visible ? t("form.hidePassword") : t("form.showPassword")}
            onClick={onToggle}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
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

export interface AuthPhoneInputProps {
  label?: ReactNode;
  hint?: ReactNode;
  value: string;
  invalid?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (digits: string) => void;
}

export function AuthPhoneInput({
  label,
  hint,
  value,
  invalid = false,
  placeholder,
  autoFocus,
  onChange,
}: AuthPhoneInputProps) {
  return (
    <label className="flex w-full flex-col gap-1">
      {label ? <span className="text-body-sm text-ink">{label}</span> : null}
      <span
        className={`flex h-14 w-full items-center rounded-2xl border bg-subtle px-5 transition-colors lg:h-14.5 lg:rounded-full ${
          invalid ? "border-error-text" : "border-transparent focus-within:border-focus"
        }`}
      >
        <span className="shrink-0 text-title text-ink">+998</span>
        <i className="mx-3 h-6 w-px shrink-0 bg-line-subtle not-italic" aria-hidden="true" />
        <input
          className={`h-full min-w-0 flex-1 bg-transparent text-title outline-none placeholder:font-normal placeholder:text-ink-secondary ${
            invalid ? "text-error-text" : "text-ink"
          }`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={formatUzPhone(value)}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, UZ_PHONE_LENGTH))
          }
        />
      </span>
      {hint ? <span className="pt-2.5 text-caption text-ink-secondary">{hint}</span> : null}
    </label>
  );
}

export function AuthFieldError({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption text-error-text lg:px-2" role="alert">
      {children}
    </p>
  );
}

import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { googleFormUrlInvalid } from "../lib/google-form";

export interface GoogleFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export function GoogleFormField({ value, onChange, compact = false }: GoogleFormFieldProps) {
  const { t } = useTranslation("homework");
  const invalid = googleFormUrlInvalid(value);

  return (
    <label className="flex flex-col gap-2">
      <span className={compact ? "text-body-sm text-ink" : "text-body-xs text-ink-secondary"}>
        {t("form.googleForm")}
      </span>
      <span
        className={`flex items-center gap-2.5 border px-4 transition-colors ${
          compact ? "h-13 rounded-lg border-[1.5px] bg-surface" : "h-12.5 rounded-md bg-subtle focus-within:bg-surface"
        } ${invalid ? "border-danger" : "border-transparent focus-within:border-focus"}`}
      >
        <Icon name="link" size={18} className="shrink-0 text-ink-tertiary" />
        <input
          type="url"
          inputMode="url"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
          value={value}
          placeholder="https://forms.gle/…"
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <small className={`text-body-xs ${invalid ? "text-danger" : "text-ink-tertiary"}`}>
        {invalid ? t("form.googleFormInvalid") : t("form.googleFormHint")}
      </small>
    </label>
  );
}

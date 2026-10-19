import { useRef } from "react";
import { useTranslation } from "react-i18next";

export interface OtpInputProps {
  length?: number;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export function OtpInput({ length = 5, value, invalid = false, onChange }: OtpInputProps) {
  const { t } = useTranslation("auth");
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function setDigit(index: number, digit: string) {
    const next = digits.map((item, position) => (position === index ? digit : item)).join("");
    onChange(next.replace(/\s/g, ""));
    if (digit && index < length - 1) boxes.current[index + 1]?.focus();
  }

  return (
    <div className="flex items-center gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            boxes.current[index] = node;
          }}
          className={`h-16 w-full min-w-0 rounded-2xl border bg-subtle text-center font-heading text-h2 outline-none transition-colors focus:border-focus ${
            invalid ? "border-error-text text-error-text" : "border-line text-ink"
          }`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          aria-label={t("mobile.code.digitAria", { number: index + 1 })}
          onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) boxes.current[index - 1]?.focus();
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (pasted) {
              onChange(pasted);
              boxes.current[Math.min(pasted.length, length - 1)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

import { useRef } from "react";
import { useTranslation } from "react-i18next";

export type OtpTone = "idle" | "verifying" | "invalid";

export interface OtpInputProps {
  length?: number;
  value: string;
  invalid?: boolean;
  tone?: OtpTone;
  onChange: (value: string) => void;
}

const TONE: Record<OtpTone, string> = {
  idle:
    "border-transparent bg-subtle text-ink focus:border-focus focus:bg-surface lg:border-line lg:focus:bg-subtle",
  verifying: "border-success bg-subtle text-ink",
  invalid: "border-error-text bg-danger-bg text-error-text lg:bg-subtle",
};

export function OtpInput({
  length = 5,
  value,
  invalid = false,
  tone,
  onChange,
}: OtpInputProps) {
  const { t } = useTranslation("auth");
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const resolved: OtpTone = tone ?? (invalid ? "invalid" : "idle");

  function setDigit(index: number, digit: string) {
    const next = digits.map((item, position) => (position === index ? digit : item)).join("");
    onChange(next.replace(/\s/g, ""));
    if (digit && index < length - 1) boxes.current[index + 1]?.focus();
  }

  return (
    <div className="flex items-center justify-center gap-3 lg:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            boxes.current[index] = node;
          }}
          className={`h-16 w-14.5 min-w-0 shrink rounded-xl border-2 text-center font-heading text-h1 caret-brand outline-none transition-colors lg:w-full lg:flex-1 lg:rounded-2xl lg:border lg:text-h2 ${TONE[resolved]}`}
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

import { useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { FormulaPalette, MathFieldInput, type MathFieldInputHandle } from "@/modules/board";
import { MathText } from "@/modules/quiz";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { formulaSnippet, insertAt } from "../lib/insert-formula";

type FieldElement = HTMLTextAreaElement | HTMLInputElement;

interface FormulaFieldBase {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

type FormulaFieldProps =
  | (FormulaFieldBase & { multiline: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">)
  | (FormulaFieldBase & { multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">);

export function FormulaField(props: FormulaFieldProps) {
  const { t } = useTranslation("homework");
  const { value, onValueChange, disabled = false } = props;
  const fieldRef = useRef<FieldElement | null>(null);
  const selection = useRef({ start: value.length, end: value.length });
  const [open, setOpen] = useState(false);
  const hasFormula = /\$[^$]+\$/.test(value);

  function remember() {
    const field = fieldRef.current;
    if (field) selection.current = { start: field.selectionStart ?? value.length, end: field.selectionEnd ?? value.length };
  }

  function insert(snippet: string) {
    const max = fieldRef.current?.maxLength ?? -1;
    const next = insertAt(value, snippet, selection.current.start, selection.current.end);
    if (max > 0 && next.value.length > max) return false;
    onValueChange(next.value);
    selection.current = { start: next.caret, end: next.caret };
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(next.caret, next.caret);
    });
    return true;
  }

  const shared = {
    value,
    disabled,
    onSelect: remember,
    onKeyUp: remember,
    onClick: remember,
  };

  let field;
  if (props.multiline) {
    const { multiline: _multiline, value: _value, onValueChange: _change, disabled: _disabled, ...rest } = props;
    field = (
      <textarea
        {...rest}
        {...shared}
        ref={(node) => {
          fieldRef.current = node;
        }}
        onChange={(event) => onValueChange(event.target.value)}
      />
    );
  } else {
    const { multiline: _multiline, value: _value, onValueChange: _change, disabled: _disabled, ...rest } = props;
    field = (
      <input
        {...rest}
        {...shared}
        ref={(node) => {
          fieldRef.current = node;
        }}
        onChange={(event) => onValueChange(event.target.value)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {field}
      {disabled ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand transition-colors hover:bg-tint"
            onClick={() => {
              remember();
              setOpen(true);
            }}
          >
            <Icon name="functions" size={16} />
            {t("formula.add")}
          </button>
          {hasFormula ? (
            <span className="min-w-0 flex-1 truncate text-body-sm text-ink-secondary" aria-label={t("formula.preview")}>
              <MathText text={value} size={15} />
            </span>
          ) : null}
        </div>
      )}
      {open ? <FormulaDialog onClose={() => setOpen(false)} onInsert={insert} /> : null}
    </div>
  );
}

function FormulaDialog({ onClose, onInsert }: { onClose: () => void; onInsert: (snippet: string) => boolean }) {
  const { t } = useTranslation("homework");
  const mathRef = useRef<MathFieldInputHandle>(null);
  const [latex, setLatex] = useState("");
  const [tooLong, setTooLong] = useState(false);
  const snippet = formulaSnippet(latex);

  return (
    <AppDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      variant="sheet"
      width="lg:w-140"
      title={t("formula.title")}
      description={t("formula.description")}
      footer={
        <>
          <button type="button" className={dialogButton.secondary} onClick={onClose}>
            {t("formula.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!snippet}
            onClick={() => {
              if (onInsert(snippet)) onClose();
              else setTooLong(true);
            }}
          >
            {t("formula.insert")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormulaPalette onInsert={(value) => mathRef.current?.insert(value)} />
        <MathFieldInput ref={mathRef} value={latex} onChange={setLatex} virtualKeyboard="manual" />
        {tooLong ? <small className="text-body-xs text-error-text">{t("formula.tooLong")}</small> : null}
      </div>
    </AppDialog>
  );
}

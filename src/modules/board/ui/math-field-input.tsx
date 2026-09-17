import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadMathfieldElement } from "../lib/mathlive-loader";

export interface MathFieldInputProps {
  value: string;
  onChange: (latex: string) => void;
}

export interface MathFieldInputHandle {
  insert: (latex: string) => void;
}

type MathfieldHost = HTMLElement & {
  value: string;
  insert?: (
    latex: string,
    options?: { selectionMode?: "placeholder" | "after"; focus?: boolean; scrollIntoView?: boolean }
  ) => boolean;
};

export const MathFieldInput = forwardRef<MathFieldInputHandle, MathFieldInputProps>(function MathFieldInput(
  { value, onChange },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathfieldHost | null>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      insert(latex: string) {
        const field = fieldRef.current;
        if (field?.insert) {
          field.insert(latex, { selectionMode: "placeholder", focus: true, scrollIntoView: true });
          onChange(field.value);
          return;
        }
        const plain = latex.replace(/#[0?@]/g, "");
        onChange(`${value}${plain}`);
        fallbackRef.current?.focus();
      },
    }),
    [onChange, value]
  );

  useEffect(() => {
    let active = true;
    loadMathfieldElement().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!ready || !host) return;

    const field = document.createElement("math-field") as MathfieldHost;
    field.className = "math-field";
    field.value = value;
    const handleInput = () => onChange(field.value);
    field.addEventListener("input", handleInput);
    host.replaceChildren(field);
    fieldRef.current = field;
    field.focus();

    return () => {
      field.removeEventListener("input", handleInput);
      fieldRef.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return (
      <div className="input-shell">
        <input
          ref={fallbackRef}
          autoFocus
          value={value}
          placeholder="\frac{a}{b}"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  return <div className="math-field-host" ref={hostRef} />;
});

import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CodeLanguage } from "../api/board.dto";
import { CODE_MAX_CHARS } from "../constants/board.constants";
import { indentCode, newlineWithIndent, outdentCode, type CodeEdit } from "../lib/code-editing";
import { CODE_BACKGROUND, CODE_FONT, detectCodeLanguage } from "../lib/code-highlight";
import { useCodeTokens } from "../model/use-code-tokens";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  languages: CodeLanguage[];
  onSubmit: () => void;
  onCancel: () => void;
  variant?: "default" | "mobile";
}

const TEXT = "#1c1e3a";

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  languages,
  onSubmit,
  onCancel,
  variant = "default",
}: CodeEditorProps) {
  const { t } = useTranslation("board");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const layerRef = useRef<HTMLPreElement>(null);
  const pendingSelection = useRef<CodeEdit | null>(null);
  const tokens = useCodeTokens(value, language);
  const detected = language === "auto" && value.trim() ? detectCodeLanguage(value) : null;
  const detectedLabel = detected ? (languages.find((item) => item.id === detected)?.label ?? detected) : null;
  const mobile = variant === "mobile";

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }, []);

  useEffect(() => {
    const edit = pendingSelection.current;
    if (!edit || !areaRef.current) return;
    pendingSelection.current = null;
    areaRef.current.setSelectionRange(edit.start, edit.end);
  }, [value]);

  function apply(edit: CodeEdit) {
    if (edit.value.length > CODE_MAX_CHARS) return;
    pendingSelection.current = edit;
    onChange(edit.value);
  }

  function syncScroll() {
    const area = areaRef.current;
    const layer = layerRef.current;
    if (area && layer) layer.style.transform = `translate(${-area.scrollLeft}px, ${-area.scrollTop}px)`;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const area = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = area;
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      apply(event.shiftKey ? outdentCode(area.value, start, end) : indentCode(area.value, start, end));
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      apply(newlineWithIndent(area.value, start, end));
    }
  }

  const fontSize = mobile ? 15 : 14;
  const metrics = {
    fontFamily: CODE_FONT,
    fontSize,
    lineHeight: 1.5,
    tabSize: 4,
    whiteSpace: "pre" as const,
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <select
          aria-label={t("code.language")}
          value={language}
          className={`h-9 max-w-[60%] min-w-0 truncate rounded-full border border-line bg-surface px-3 text-body-sm font-medium text-ink outline-none focus:border-focus ${
            mobile ? "h-10" : ""
          }`}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {languages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id === "auto" && detectedLabel ? t("code.detected", { language: detectedLabel }) : item.label}
            </option>
          ))}
        </select>
        <span className="min-w-0 flex-1" />
        <small
          className={`shrink-0 font-numeric text-caption ${
            value.length > CODE_MAX_CHARS * 0.9 ? "text-warning-text" : "text-ink-tertiary"
          }`}
        >
          {t("code.counter", { count: value.length, max: CODE_MAX_CHARS })}
        </small>
      </div>
      <div
        className={`relative overflow-hidden rounded-md border border-line focus-within:border-focus ${
          mobile ? "h-40" : "h-44"
        }`}
        style={{ background: CODE_BACKGROUND }}
      >
        <pre
          ref={layerRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 m-0 min-w-full px-3 py-2.5"
          style={{ ...metrics, color: TEXT }}
        >
          {tokens.map((line, index) => (
            <span key={index}>
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} style={token.color ? { color: token.color } : undefined}>
                  {token.text}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </pre>
        <textarea
          ref={areaRef}
          value={value}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={CODE_MAX_CHARS}
          aria-label={t("code.aria")}
          placeholder={t("code.placeholder")}
          className="absolute inset-0 m-0 size-full resize-none overflow-auto bg-transparent px-3 py-2.5 text-transparent caret-ink outline-none selection:bg-brand/25 placeholder:text-ink-tertiary"
          style={metrics}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
        />
      </div>
      <small className="text-caption text-ink-tertiary">{t("code.hint")}</small>
    </div>
  );
}

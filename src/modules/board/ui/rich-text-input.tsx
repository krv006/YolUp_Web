import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TextLineDto } from "../api/board.dto";
import { htmlToLines } from "../lib/rich-text";

export interface RichTextInputProps {
  onChange: (lines: TextLineDto[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

type FormatCommand = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList";

const COMMANDS: Array<{ command: FormatCommand; icon: typeof Bold; labelKey: string; shortcut?: string }> = [
  { command: "bold", icon: Bold, labelKey: "inline.bold", shortcut: "B" },
  { command: "italic", icon: Italic, labelKey: "inline.italic", shortcut: "I" },
  { command: "underline", icon: Underline, labelKey: "inline.underline", shortcut: "U" },
  { command: "insertUnorderedList", icon: List, labelKey: "inline.bulletList" },
  { command: "insertOrderedList", icon: ListOrdered, labelKey: "inline.numberedList" },
];

type ActiveState = Record<FormatCommand, boolean>;

const INACTIVE: ActiveState = {
  bold: false,
  italic: false,
  underline: false,
  insertUnorderedList: false,
  insertOrderedList: false,
};

export function RichTextInput({ onChange, onSubmit, onCancel }: RichTextInputProps) {
  const { t } = useTranslation("board");
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveState>(INACTIVE);
  const [empty, setEmpty] = useState(true);

  const emit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const lines = htmlToLines(editor);
    setEmpty(!lines.some((line) => line.runs.some((run) => run.text.trim())));
    onChange(lines);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  useEffect(() => {
    editorRef.current?.focus();
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  function run(command: FormatCommand) {
    editorRef.current?.focus();
    document.execCommand(command);
    refreshActive();
    emit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
    if (event.metaKey || event.ctrlKey) {
      const match = COMMANDS.find((item) => item.shortcut === event.key.toUpperCase());
      if (match) {
        event.preventDefault();
        run(match.command);
      }
    }
  }

  return (
    <div className="rich-text-input">
      <div
        className="rich-text-toolbar"
        role="toolbar"
        aria-label={t("inline.formatAria")}
        onPointerDown={(event) => event.preventDefault()}
      >
        {COMMANDS.map(({ command, icon: Icon, labelKey, shortcut }) => {
          const label = shortcut ? `${t(labelKey)} (Ctrl+${shortcut})` : t(labelKey);
          return (
            <button
              key={command}
              type="button"
              className={active[command] ? "is-active" : ""}
              aria-pressed={active[command]}
              aria-label={label}
              title={label}
              onClick={() => run(command)}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        className={`rich-text-editor ${empty ? "is-empty" : ""}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={t("inline.textAria")}
        data-placeholder={t("inline.placeholder")}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
      />
    </div>
  );
}

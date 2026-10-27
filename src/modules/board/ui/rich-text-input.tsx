import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import type { TextLineDto } from "../api/board.dto";
import { htmlToLines } from "../lib/rich-text";

export interface RichTextInputProps {
  onChange: (lines: TextLineDto[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  variant?: "default" | "mobile";
}

type FormatCommand = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList";

const COMMANDS: Array<{
  command: FormatCommand;
  icon: typeof Bold;
  mobileIcon: string;
  labelKey: string;
  shortcut?: string;
}> = [
  { command: "bold", icon: Bold, mobileIcon: "format-bold", labelKey: "inline.bold", shortcut: "B" },
  { command: "italic", icon: Italic, mobileIcon: "format-italic", labelKey: "inline.italic", shortcut: "I" },
  { command: "underline", icon: Underline, mobileIcon: "format-underlined", labelKey: "inline.underline", shortcut: "U" },
  { command: "insertUnorderedList", icon: List, mobileIcon: "format-list-bulleted", labelKey: "inline.bulletList" },
  { command: "insertOrderedList", icon: ListOrdered, mobileIcon: "format-list-numbered", labelKey: "inline.numberedList" },
];

type ActiveState = Record<FormatCommand, boolean>;

const INACTIVE: ActiveState = {
  bold: false,
  italic: false,
  underline: false,
  insertUnorderedList: false,
  insertOrderedList: false,
};

export function RichTextInput({ onChange, onSubmit, onCancel, variant = "default" }: RichTextInputProps) {
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

  const mobile = variant === "mobile";

  return (
    <div className={mobile ? "flex min-w-0 flex-col gap-[11px]" : "rich-text-input"}>
      <div
        className={mobile ? "flex h-8 items-center gap-1.5" : "rich-text-toolbar"}
        role="toolbar"
        aria-label={t("inline.formatAria")}
        onPointerDown={(event) => event.preventDefault()}
      >
        {COMMANDS.map(({ command, icon: CommandIcon, mobileIcon, labelKey, shortcut }) => {
          const label = shortcut ? `${t(labelKey)} (Ctrl+${shortcut})` : t(labelKey);
          return (
            <button
              key={command}
              type="button"
              className={
                mobile
                  ? `grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                      active[command] ? "bg-brand-subtle text-brand" : "text-ink hover:bg-subtle"
                    }`
                  : active[command]
                    ? "is-active"
                    : ""
              }
              aria-pressed={active[command]}
              aria-label={label}
              title={label}
              onClick={() => run(command)}
            >
              {mobile ? <Icon name={mobileIcon} size={18} /> : <CommandIcon size={15} />}
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        className={
          mobile
            ? `relative max-h-40 min-h-[71px] overflow-y-auto rounded-xl border-[1.5px] border-transparent bg-subtle px-3.5 py-2.5 text-label-lg leading-6 font-normal break-words whitespace-pre-wrap text-ink outline-none focus:border-brand [&_b]:font-semibold [&_ol]:list-inside [&_ol]:list-decimal [&_strong]:font-semibold [&_ul>li]:before:content-['•_'] ${
                empty ? "before:pointer-events-none before:absolute before:text-ink-secondary before:content-[attr(data-placeholder)]" : ""
              }`
            : `rich-text-editor ${empty ? "is-empty" : ""}`
        }
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

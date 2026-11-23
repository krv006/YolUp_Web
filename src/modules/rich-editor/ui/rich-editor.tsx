import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createExtensions } from "../lib/extensions";
import { EditorToolbar } from "./editor-toolbar";
import { FloatingBars } from "./floating-bars";
import { FormulaDialog } from "./formula-dialog";
import { Popup } from "./popup";

export type QuestionKind = "single" | "multiple" | "short" | "long";

export interface RichEditorProps {
  /** Boshlang'ich HTML (keyin o'zgarmaydi: muharrir o'z holatini o'zi yuritadi). */
  initialHtml: string;
  onChange: (html: string) => void;
  /** Rasmni serverga yuklab, `<img src>` uchun manzilni qaytaradi. */
  uploadImage: (file: File) => Promise<string>;
  /** "/" menyusidagi "Savol qo'shish" bandlari uchun. */
  onAddQuestion?: (kind: QuestionKind) => void;
  onReady?: (editor: Editor) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface SlashItem {
  group: string;
  label: string;
  hint: string;
  icon: string;
  run: (editor: Editor) => void;
}

interface SlashState {
  from: number;
  to: number;
  query: string;
  top: number;
  left: number;
}

/**
 * Vazifa yozish muharriri (TipTap): katta oq sahifa, "/" menyusi, formula (`$$..$$` va oyna), kod, jadval, rasm (Ctrl+V,
 * sudrab tashlash, fayl), rang/shrift, tez almashtirishlar. HTML qaytaradi; backend uni yana tozalaydi.
 */
export function RichEditor({ initialHtml, onChange, uploadImage, onAddQuestion, onReady }: RichEditorProps) {
  const { t } = useTranslation("editor");
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [formula, setFormula] = useState<{ pos: number | null; latex: string | null } | null>(null);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);

  const slashRef = useRef<SlashState | null>(null);
  const slashItemsRef = useRef<SlashItem[]>([]);
  const slashIndexRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const uploadRef = useRef(uploadImage);
  useEffect(() => {
    onChangeRef.current = onChange;
    uploadRef.current = uploadImage;
  });

  const insertImages = useCallback(
    async (files: File[], target: Editor) => {
      const images = files.filter((file) => file.type.startsWith("image/"));
      if (!images.length) {
        toast.error(t("image.notImage"));
        return;
      }
      for (const file of images) {
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(t("image.tooBig"));
          continue;
        }
        try {
          const src = await uploadRef.current(file);
          target.chain().focus().insertContentAt(target.state.selection.to, { type: "image", attrs: { src, alt: "", width: "60%" } }).run();
        } catch {
          toast.error(t("image.uploadFailed"));
        }
      }
    },
    [t]
  );
  const insertImagesRef = useRef(insertImages);
  useEffect(() => {
    insertImagesRef.current = insertImages;
  });

  const extensions = useMemo(
    () => createExtensions({ onFormulaClick: (target) => setFormula({ pos: target.pos, latex: target.latex }) }),
    []
  );

  const editor = useEditor({
    extensions,
    content: initialHtml,
    onUpdate: ({ editor: current }) => onChangeRef.current(current.isEmpty ? "" : current.getHTML()),
    onTransaction: ({ editor: current }) => updateSlash(current),
    editorProps: {
      attributes: { spellcheck: "false", role: "textbox", "aria-multiline": "true", "aria-label": t("editor.label") },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (!files.length) return false;
        void insertImagesRef.current(files, editorRef.current as Editor);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.length) return false;
        event.preventDefault();
        void insertImagesRef.current(files, editorRef.current as Editor);
        return true;
      },
      handleKeyDown: (_view, event) => {
        const current = editorRef.current;
        if (slashRef.current && slashItemsRef.current.length && current) {
          const items = slashItemsRef.current;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const step = event.key === "ArrowDown" ? 1 : -1;
            const next = (slashIndexRef.current + step + items.length) % items.length;
            slashIndexRef.current = next;
            setSlashIndex(next);
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            runSlash(items[slashIndexRef.current]);
            return true;
          }
          if (event.key === "Escape") {
            closeSlash();
            return true;
          }
        }
        if (event.key === "Tab" && current?.isActive("codeBlock")) {
          if (!event.shiftKey) current.commands.insertContent("    ");
          return true;
        }
        return false;
      },
    },
  });

  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
    if (editor) onReady?.(editor);
  }, [editor, onReady]);

  // Sahifaning istalgan joyida yozishni boshlash: hech narsa tanlanmagan bo'lsa, harf muharrirga tushadi.
  useEffect(() => {
    if (!editor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        if (active.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "MATH-FIELD"].includes(active.tagName)) return;
        if (active.closest("[role=dialog],[role=listbox],[role=menu]")) return;
      }
      if (document.querySelector("[role=dialog]") || editor.view.dom.offsetParent === null) return;
      event.preventDefault();
      editor.chain().focus("end").insertContent(event.key).run();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  const items = useMemo<SlashItem[]>(() => {
    const basic = t("slash.basic");
    const insert = t("slash.insert");
    const questions = t("slash.questions");
    const list: SlashItem[] = [
      { group: basic, label: t("blocks.p"), hint: t("slash.hints.p"), icon: "T", run: (e) => e.chain().focus().setParagraph().run() },
      { group: basic, label: t("blocks.h1"), hint: t("slash.hints.h1"), icon: "H1", run: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
      { group: basic, label: t("blocks.h2"), hint: t("slash.hints.h2"), icon: "H2", run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
      { group: basic, label: t("blocks.h3"), hint: t("slash.hints.h3"), icon: "H3", run: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
      { group: basic, label: t("toolbar.bulletList"), hint: t("slash.hints.bullet"), icon: "•", run: (e) => e.chain().focus().toggleBulletList().run() },
      { group: basic, label: t("toolbar.orderedList"), hint: t("slash.hints.ordered"), icon: "1.", run: (e) => e.chain().focus().toggleOrderedList().run() },
      { group: basic, label: t("blocks.quote"), hint: t("slash.hints.quote"), icon: "“", run: (e) => e.chain().focus().toggleBlockquote().run() },
      { group: basic, label: t("slash.divider"), hint: t("slash.hints.divider"), icon: "—", run: (e) => e.chain().focus().setHorizontalRule().run() },
      { group: insert, label: t("toolbar.table"), hint: t("slash.hints.table"), icon: "#", run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { group: insert, label: t("toolbar.image"), hint: t("slash.hints.image"), icon: "▣", run: () => fileInput?.click() },
      { group: insert, label: t("toolbar.callout"), hint: t("slash.hints.callout"), icon: "!", run: (e) => e.chain().focus().insertContent({ type: "callout", content: [{ type: "paragraph" }] }).run() },
      { group: insert, label: t("toolbar.formula"), hint: t("slash.hints.formula"), icon: "Σ", run: () => setFormula({ pos: null, latex: null }) },
      { group: insert, label: t("codeMenu.block"), hint: t("slash.hints.code"), icon: "{ }", run: (e) => e.chain().focus().setCodeBlock({ language: "python" }).run() },
    ];
    if (onAddQuestion) {
      const kinds: QuestionKind[] = ["single", "multiple", "short", "long"];
      kinds.forEach((kind, index) =>
        list.push({
          group: questions,
          label: t(`slash.question.${kind}`),
          hint: t(`slash.question.${kind}Hint`),
          icon: ["1", "✓", "Aa", "¶"][index] ?? "?",
          run: () => onAddQuestion(kind),
        })
      );
    }
    return list;
  }, [t, onAddQuestion, fileInput]);

  const visibleItems = useMemo(() => {
    const query = slash?.query.toLowerCase() ?? "";
    return items.filter((item) => !query || item.label.toLowerCase().includes(query) || item.hint.toLowerCase().includes(query));
  }, [items, slash?.query]);

  useEffect(() => {
    slashItemsRef.current = visibleItems;
    slashIndexRef.current = Math.min(slashIndexRef.current, Math.max(visibleItems.length - 1, 0));
  }, [visibleItems]);

  function closeSlash() {
    slashRef.current = null;
    setSlash(null);
  }

  function updateSlash(current: Editor) {
    const selection = current.state.selection;
    const parent = selection.$from.parent;
    if (!selection.empty || !parent.isTextblock || parent.type.name === "codeBlock") {
      if (slashRef.current) closeSlash();
      return;
    }
    const text = parent.textBetween(0, selection.$from.parentOffset, undefined, "￼");
    const match = /(?:^|\s)\/([^\s/]{0,18})$/.exec(text);
    if (!match) {
      if (slashRef.current) closeSlash();
      return;
    }
    const query = match[1] ?? "";
    const coords = current.view.coordsAtPos(selection.from);
    const next: SlashState = { from: selection.from - query.length - 1, to: selection.from, query, top: coords.bottom + 6, left: coords.left };
    if (slashRef.current?.query !== query) {
      slashIndexRef.current = 0;
      setSlashIndex(0);
    }
    slashRef.current = next;
    setSlash(next);
  }

  function runSlash(item: SlashItem | undefined) {
    const state = slashRef.current;
    const current = editorRef.current;
    if (!item || !state || !current) return;
    closeSlash();
    current.chain().focus().deleteRange({ from: state.from, to: state.to }).run();
    item.run(current);
  }

  if (!editor) return null;

  const formulaTarget = formula;
  return (
    <div className="rich-editor flex flex-col gap-3">
      <div className="sticky top-2 z-20">
        <EditorToolbar
          editor={editor}
          onOpenFormula={() => setFormula({ pos: null, latex: null })}
          onPickImage={() => fileInput?.click()}
        />
      </div>
      <div
        className="min-h-130 cursor-text rounded-2xl border border-line bg-surface px-6 py-10 shadow-xs sm:px-14"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.classList.contains("ProseMirror")) editor.chain().focus("end").run();
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <FloatingBars editor={editor} />

      <input
        ref={setFileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void insertImages(files, editor);
        }}
      />

      <FormulaDialog
        open={Boolean(formulaTarget)}
        latex={formulaTarget?.latex ?? null}
        onOpenChange={(open) => !open && setFormula(null)}
        onSubmit={(latex) => {
          const target = formulaTarget;
          setFormula(null);
          if (target && target.pos !== null) editor.chain().focus().updateInlineMath({ latex, pos: target.pos }).run();
          else editor.chain().focus().insertInlineMath({ latex }).insertContent(" ").run();
        }}
        onDelete={() => {
          const target = formulaTarget;
          setFormula(null);
          if (target && target.pos !== null) editor.chain().focus().deleteInlineMath({ pos: target.pos }).run();
        }}
      />

      {slash && visibleItems.length ? (
        <Popup position={{ top: slash.top, left: slash.left }} closeOnOutside={false} className="max-h-84 w-72 overflow-auto p-1.5">
          {visibleItems.map((item, index) => (
            <div key={`${item.group}-${item.label}`}>
              {index === 0 || visibleItems[index - 1]?.group !== item.group ? (
                <p className="px-2 pt-1.5 pb-0.5 text-caption tracking-wide text-ink-tertiary uppercase">{item.group}</p>
              ) : null}
              <button
                type="button"
                role="option"
                aria-selected={index === slashIndex}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left ${index === slashIndex ? "bg-brand-subtle" : "hover:bg-subtle"}`}
                onClick={() => runSlash(item)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface text-body-xs font-semibold text-ink-secondary">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-body-sm font-medium">{item.label}</b>
                  <small className="block truncate text-caption text-ink-tertiary">{item.hint}</small>
                </span>
              </button>
            </div>
          ))}
        </Popup>
      ) : null}
    </div>
  );
}

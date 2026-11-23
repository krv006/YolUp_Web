import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { FONT_FAMILIES, FONT_SIZES, HIGHLIGHT_COLORS, SYMBOLS, TEXT_COLORS, type SymbolTab } from "../lib/symbols";
import { Popup, type PopupPosition } from "./popup";
import { barButton, barButtonActive, below } from "./popup-utils";

type MenuKind = "block" | "font" | "size" | "color" | "highlight" | "formula" | "code";

export interface EditorToolbarProps {
  editor: Editor;
  onOpenFormula: () => void;
  onPickImage: () => void;
}

function ToolButton({
  label,
  active = false,
  onClick,
  children,
  wide = false,
}: {
  label: string;
  active?: boolean;
  onClick: (element: HTMLButtonElement) => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`${barButton} ${active ? barButtonActive : ""} ${wide ? "px-2.5 font-medium text-ink" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => onClick(event.currentTarget)}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />;

export function EditorToolbar({ editor, onOpenFormula, onPickImage }: EditorToolbarProps) {
  const { t } = useTranslation("editor");
  const [menu, setMenu] = useState<{ kind: MenuKind; position: PopupPosition } | null>(null);
  const [symbolTab, setSymbolTab] = useState<SymbolTab>("math");

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
      left: current.isActive({ textAlign: "left" }),
      center: current.isActive({ textAlign: "center" }),
      right: current.isActive({ textAlign: "right" }),
      code: current.isActive("codeBlock"),
      inlineCode: current.isActive("code"),
      link: current.isActive("link"),
      block: current.isActive("heading", { level: 1 })
        ? "h1"
        : current.isActive("heading", { level: 2 })
          ? "h2"
          : current.isActive("heading", { level: 3 })
            ? "h3"
            : current.isActive("blockquote")
              ? "quote"
              : "p",
    }),
  });

  const open = (kind: MenuKind) => (element: HTMLButtonElement) =>
    setMenu((current) => (current?.kind === kind ? null : { kind, position: below(element) }));
  const close = () => setMenu(null);
  const run = (action: () => void) => {
    action();
    close();
  };

  function setLink() {
    const url = window.prompt(t("link.prompt"), "https://");
    if (url && /^https?:\/\//i.test(url)) editor.chain().focus().setLink({ href: url }).run();
  }

  const blocks: Array<{ id: string; label: string; apply: () => void }> = [
    { id: "p", label: t("blocks.p"), apply: () => editor.chain().focus().setParagraph().run() },
    { id: "h1", label: t("blocks.h1"), apply: () => editor.chain().focus().setHeading({ level: 1 }).run() },
    { id: "h2", label: t("blocks.h2"), apply: () => editor.chain().focus().setHeading({ level: 2 }).run() },
    { id: "h3", label: t("blocks.h3"), apply: () => editor.chain().focus().setHeading({ level: 3 }).run() },
    { id: "quote", label: t("blocks.quote"), apply: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div role="toolbar" aria-label={t("toolbar.label")} className="rounded-xl border border-line bg-surface px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-0.5">
        <ToolButton label={t("toolbar.undo")} onClick={() => editor.chain().focus().undo().run()}>
          <Icon name="undo" size={17} />
        </ToolButton>
        <ToolButton label={t("toolbar.redo")} onClick={() => editor.chain().focus().redo().run()}>
          <Icon name="redo" size={17} />
        </ToolButton>
        <Sep />
        <ToolButton label={t("toolbar.block")} wide onClick={open("block")}>
          {t(`blocks.${state.block}`)} <Icon name="expand-more" size={14} />
        </ToolButton>
        <ToolButton label={t("toolbar.font")} wide onClick={open("font")}>
          {t("toolbar.font")} <Icon name="expand-more" size={14} />
        </ToolButton>
        <ToolButton label={t("toolbar.size")} wide onClick={open("size")}>
          {t("toolbar.size")} <Icon name="expand-more" size={14} />
        </ToolButton>
        <Sep />
        <ToolButton label={t("toolbar.bold")} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Icon name="format-bold" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.italic")} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Icon name="format-italic" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.underline")} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Icon name="format-underlined" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.strike")} active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Icon name="format-strikethrough" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.textColor")} onClick={open("color")}>
          <Icon name="text-fields" size={18} /> <Icon name="expand-more" size={14} />
        </ToolButton>
        <ToolButton label={t("toolbar.highlight")} onClick={open("highlight")}>
          <Icon name="palette" size={18} /> <Icon name="expand-more" size={14} />
        </ToolButton>
        <Sep />
        <ToolButton label={t("toolbar.bulletList")} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <Icon name="format-list-bulleted" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.orderedList")} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <Icon name="format-list-numbered" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.alignLeft")} active={state.left} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <Icon name="format-align-left" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.alignCenter")} active={state.center} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <Icon name="format-align-center" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.alignRight")} active={state.right} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <Icon name="format-align-right" size={18} />
        </ToolButton>
        <Sep />
        <ToolButton label={t("toolbar.link")} active={state.link} onClick={setLink}>
          <Icon name="link" size={18} />
        </ToolButton>
        <ToolButton label={t("toolbar.clear")} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Icon name="link-off" size={18} />
        </ToolButton>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-0.5 border-t border-line pt-1.5">
        <span className="mr-2 ml-1.5 text-body-xs font-medium text-ink-tertiary">{t("toolbar.insert")}</span>
        <ToolButton label={t("toolbar.formula")} wide onClick={open("formula")}>
          <span className="font-bold text-brand">Σ</span> {t("toolbar.formula")}
        </ToolButton>
        <ToolButton label={t("toolbar.code")} wide active={state.code || state.inlineCode} onClick={open("code")}>
          <Icon name="code" size={17} className="text-brand" /> {t("toolbar.code")}
        </ToolButton>
        <ToolButton
          label={t("toolbar.table")}
          wide
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Icon name="table-grid" size={17} className="text-brand" /> {t("toolbar.table")}
        </ToolButton>
        <ToolButton label={t("toolbar.image")} wide onClick={onPickImage}>
          <Icon name="image" size={17} className="text-brand" /> {t("toolbar.image")}
        </ToolButton>
        <ToolButton
          label={t("toolbar.callout")}
          wide
          onClick={() =>
            editor.chain().focus().insertContent({ type: "callout", content: [{ type: "paragraph" }] }).run()
          }
        >
          <span className="font-bold text-brand">!</span> {t("toolbar.callout")}
        </ToolButton>
      </div>

      {menu?.kind === "block" ? (
        <Popup position={menu.position} onClose={close} className="min-w-44 p-1.5">
          {blocks.map((block) => (
            <button key={block.id} type="button" className="block w-full rounded-md px-3 py-2 text-left text-body-sm hover:bg-subtle" onClick={() => run(block.apply)}>
              {block.label}
            </button>
          ))}
        </Popup>
      ) : null}

      {menu?.kind === "font" ? (
        <Popup position={menu.position} onClose={close} className="min-w-48 p-1.5">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.key}
              type="button"
              style={font.value ? { fontFamily: font.value } : undefined}
              className="block w-full rounded-md px-3 py-2 text-left text-body-sm hover:bg-subtle"
              onClick={() => run(() => (font.value ? editor.chain().focus().setFontFamily(font.value).run() : editor.chain().focus().unsetFontFamily().run()))}
            >
              {t(`fonts.${font.key}`)}
            </button>
          ))}
        </Popup>
      ) : null}

      {menu?.kind === "size" ? (
        <Popup position={menu.position} onClose={close} className="min-w-40 p-1.5">
          {FONT_SIZES.map((size) => (
            <button
              key={size.key}
              type="button"
              style={size.value ? { fontSize: size.value } : undefined}
              className="block w-full rounded-md px-3 py-1.5 text-left hover:bg-subtle"
              onClick={() => run(() => (size.value ? editor.chain().focus().setFontSize(size.value).run() : editor.chain().focus().unsetFontSize().run()))}
            >
              {t(`sizes.${size.key}`)}
            </button>
          ))}
        </Popup>
      ) : null}

      {menu?.kind === "color" ? (
        <Popup position={menu.position} onClose={close} className="w-56 p-3">
          <p className="mb-2 text-body-xs text-ink-tertiary">{t("toolbar.textColor")}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                style={{ color }}
                className="size-8 rounded-md border border-line bg-surface text-sm font-bold"
                onClick={() => run(() => editor.chain().focus().setColor(color).run())}
              >
                A
              </button>
            ))}
          </div>
          <button type="button" className="mt-2 text-body-xs text-brand" onClick={() => run(() => editor.chain().focus().unsetColor().run())}>
            {t("toolbar.reset")}
          </button>
        </Popup>
      ) : null}

      {menu?.kind === "highlight" ? (
        <Popup position={menu.position} onClose={close} className="w-56 p-3">
          <p className="mb-2 text-body-xs text-ink-tertiary">{t("toolbar.highlight")}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                style={{ background: color }}
                className="size-8 rounded-md border border-line"
                onClick={() => run(() => editor.chain().focus().setHighlight({ color }).run())}
              />
            ))}
          </div>
          <button type="button" className="mt-2 text-body-xs text-brand" onClick={() => run(() => editor.chain().focus().unsetHighlight().run())}>
            {t("toolbar.reset")}
          </button>
        </Popup>
      ) : null}

      {menu?.kind === "formula" ? (
        <Popup position={menu.position} onClose={close} className="w-80 p-3">
          <button
            type="button"
            className="mb-2 inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-body-sm font-medium hover:bg-subtle"
            onClick={() => run(onOpenFormula)}
          >
            <span className="font-bold text-brand">Σ</span> {t("symbols.formula")}
          </button>
          <div className="mb-2 flex gap-1.5">
            {(Object.keys(SYMBOLS) as SymbolTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full border px-3 py-1 text-body-xs ${symbolTab === tab ? "border-brand bg-brand-subtle text-brand" : "border-line text-ink-secondary"}`}
                onClick={() => setSymbolTab(tab)}
              >
                {t(`symbols.tabs.${tab}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1">
            {SYMBOLS[symbolTab].map((symbol) => (
              <button
                key={symbol}
                type="button"
                className="h-8 rounded-md border border-line text-base hover:border-brand hover:bg-brand-subtle"
                onClick={() => editor.chain().focus().insertContent(symbol).run()}
              >
                {symbol}
              </button>
            ))}
          </div>
        </Popup>
      ) : null}

      {menu?.kind === "code" ? (
        <Popup position={menu.position} onClose={close} className="min-w-52 p-1.5">
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left text-body-sm hover:bg-subtle"
            onClick={() => run(() => editor.chain().focus().setCodeBlock({ language: "python" }).run())}
          >
            {t("codeMenu.block")}
          </button>
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left text-body-sm hover:bg-subtle"
            onClick={() => run(() => editor.chain().focus().toggleCode().run())}
          >
            {t("codeMenu.inline")}
          </button>
        </Popup>
      ) : null}
    </div>
  );
}

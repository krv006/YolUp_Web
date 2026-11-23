import { useEffect, useReducer, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { CODE_LANGUAGES, type CodeLanguage } from "../lib/extensions";
import { CELL_COLORS } from "../lib/symbols";
import { Popup, type PopupPosition } from "./popup";
import { barButton, barButtonActive } from "./popup-utils";

function Bar({ position, children, className = "" }: { position: PopupPosition; children: ReactNode; className?: string }) {
  return (
    <Popup position={position} closeOnOutside={false} className={`flex flex-wrap items-center gap-0.5 p-1 ${className}`}>
      {children}
    </Popup>
  );
}

function BarButton({
  children,
  onClick,
  active = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button type="button" title={title} className={`${barButton} ${active ? barButtonActive : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function nodeRect(editor: Editor, name: string): DOMRect | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === name) {
      const dom = editor.view.nodeDOM($from.before(depth));
      return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null;
    }
  }
  return null;
}

/** Tanlangan matn, jadval, rasm va kod bloki yonida chiqadigan kichik panellar. */
export function FloatingBars({ editor }: { editor: Editor }) {
  const { t } = useTranslation("editor");
  const [, redraw] = useReducer((value: number) => value + 1, 0);
  const [cellColors, setCellColors] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const selection = current.state.selection;
      const node = (selection as { node?: { type: { name: string } } }).node;
      return {
        from: selection.from,
        to: selection.to,
        focused: current.isFocused,
        textSelected:
          !selection.empty &&
          !node &&
          !("$anchorCell" in selection) &&
          !current.isActive("codeBlock") &&
          current.state.doc.textBetween(selection.from, selection.to, " ").trim().length > 0,
        inCode: current.isActive("codeBlock"),
        inTable: current.isActive("table"),
        imageSelected: node?.type.name === "image",
        language: String(current.getAttributes("codeBlock").language ?? "text"),
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        link: current.isActive("link"),
      };
    },
  });

  useEffect(() => {
    window.addEventListener("scroll", redraw, true);
    window.addEventListener("resize", redraw);
    return () => {
      window.removeEventListener("scroll", redraw, true);
      window.removeEventListener("resize", redraw);
    };
  }, []);

  if (!editor.isEditable) return null;

  const above = (rect: DOMRect | null): PopupPosition | null =>
    rect ? { top: Math.max(8, rect.top - 44), left: rect.left } : null;

  let selectionBar: PopupPosition | null = null;
  if (state.textSelected && state.focused) {
    const coords = editor.view.coordsAtPos(state.from);
    selectionBar = { top: Math.max(8, coords.top - 46), left: coords.left };
  }
  const tableBar = state.inTable ? above(nodeRect(editor, "table")) : null;
  const codeBar = state.inCode ? above(nodeRect(editor, "codeBlock")) : null;
  let imageBar: PopupPosition | null = null;
  if (state.imageSelected) {
    const dom = editor.view.nodeDOM(state.from);
    if (dom instanceof HTMLElement) imageBar = above(dom.getBoundingClientRect());
  }

  const chain = () => editor.chain().focus();

  return (
    <>
      {selectionBar ? (
        <Bar position={selectionBar}>
          <BarButton active={state.bold} title={t("toolbar.bold")} onClick={() => chain().toggleBold().run()}>
            <Icon name="format-bold" size={17} />
          </BarButton>
          <BarButton active={state.italic} title={t("toolbar.italic")} onClick={() => chain().toggleItalic().run()}>
            <Icon name="format-italic" size={17} />
          </BarButton>
          <BarButton active={state.underline} title={t("toolbar.underline")} onClick={() => chain().toggleUnderline().run()}>
            <Icon name="format-underlined" size={17} />
          </BarButton>
          <BarButton active={state.strike} title={t("toolbar.strike")} onClick={() => chain().toggleStrike().run()}>
            <Icon name="format-strikethrough" size={17} />
          </BarButton>
          <BarButton active={state.link} title={t("toolbar.link")} onClick={() => {
            const url = window.prompt(t("link.prompt"), "https://");
            if (url && /^https?:\/\//i.test(url)) chain().setLink({ href: url }).run();
          }}>
            <Icon name="link" size={17} />
          </BarButton>
          <BarButton title={t("blocks.h2")} onClick={() => chain().setHeading({ level: 2 }).run()}>
            H
          </BarButton>
        </Bar>
      ) : null}

      {tableBar ? (
        <Bar position={tableBar}>
          <BarButton onClick={() => chain().addRowAfter().run()}>+ {t("table.row")}</BarButton>
          <BarButton onClick={() => chain().addColumnAfter().run()}>+ {t("table.column")}</BarButton>
          <BarButton onClick={() => chain().deleteRow().run()}>− {t("table.row")}</BarButton>
          <BarButton onClick={() => chain().deleteColumn().run()}>− {t("table.column")}</BarButton>
          <BarButton onClick={() => chain().toggleHeaderRow().run()}>{t("table.headerRow")}</BarButton>
          <BarButton onClick={() => setCellColors((value) => !value)} active={cellColors}>
            {t("table.cellColor")}
          </BarButton>
          <BarButton onClick={() => chain().deleteTable().run()}>{t("table.delete")}</BarButton>
          {cellColors ? (
            <span className="flex w-full flex-wrap gap-1.5 p-1.5">
              {CELL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  style={{ background: color }}
                  className="size-7 rounded-md border border-line"
                  onClick={() => {
                    chain().setCellAttribute("backgroundColor", color).run();
                    setCellColors(false);
                  }}
                />
              ))}
              <button
                type="button"
                className="px-1 text-body-xs text-brand"
                onClick={() => {
                  chain().setCellAttribute("backgroundColor", null).run();
                  setCellColors(false);
                }}
              >
                {t("toolbar.reset")}
              </button>
            </span>
          ) : null}
        </Bar>
      ) : null}

      {imageBar ? (
        <Bar position={imageBar}>
          {(["25", "50", "75", "100"] as const).map((width) => (
            <BarButton key={width} onClick={() => chain().updateAttributes("image", { width: `${width}%` }).run()}>
              {width === "100" ? t("image.full") : `${width}%`}
            </BarButton>
          ))}
          <BarButton onClick={() => chain().deleteSelection().run()}>{t("image.delete")}</BarButton>
        </Bar>
      ) : null}

      {codeBar ? (
        <Bar position={codeBar} className="max-w-130">
          {CODE_LANGUAGES.map((language: CodeLanguage) => (
            <BarButton
              key={language}
              active={state.language === language || (language === "text" && !CODE_LANGUAGES.includes(state.language as CodeLanguage))}
              onClick={() => chain().updateAttributes("codeBlock", { language }).run()}
            >
              {t(`languages.${language}`)}
            </BarButton>
          ))}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <BarButton
            onClick={() => {
              const { $from } = editor.state.selection;
              for (let depth = $from.depth; depth > 0; depth -= 1) {
                if ($from.node(depth).type.name !== "codeBlock") continue;
                const after = $from.after(depth);
                const next = editor.state.doc.nodeAt(after);
                if (next?.type.name === "paragraph") chain().setTextSelection(after + 1).run();
                else chain().exitCode().run();
                return;
              }
            }}
          >
            ↵ {t("codeBar.exit")}
          </BarButton>
          <BarButton onClick={() => chain().deleteNode("codeBlock").run()}>{t("codeBar.delete")}</BarButton>
        </Bar>
      ) : null}
    </>
  );
}

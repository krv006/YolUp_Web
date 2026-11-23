import { mergeAttributes, Node, type Extensions } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { InlineMath } from "@tiptap/extension-mathematics";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight } from "lowlight";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import xml from "highlight.js/lib/languages/xml";

/** Kod bloki tillari (tanlash ro'yxati). `text` — rangsiz. */
export const CODE_LANGUAGES = ["python", "javascript", "sql", "java", "cpp", "html", "css", "text"] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

const lowlight = createLowlight();
lowlight.register({ python, javascript, sql, java, cpp, xml, css });
lowlight.register({ text: () => ({ name: "text", contains: [] }) });
lowlight.registerAlias({ xml: ["html"] });

/** Rangli ajratilgan izoh bloki (`<div class="callout">`). */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div.callout" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout" }), 0];
  },
});

function withBackground<T extends typeof TableCell>(extension: T): T {
  return extension.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        backgroundColor: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
          renderHTML: (attributes: Record<string, unknown>) =>
            attributes.backgroundColor ? { style: `background-color:${String(attributes.backgroundColor)}` } : {},
        },
      };
    },
  }) as T;
}

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.width || element.getAttribute("width") || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.width ? { style: `width:${String(attributes.width)}` } : {},
      },
    };
  },
});

export interface ExtensionOptions {
  onFormulaClick: (target: { pos: number; latex: string }) => void;
}

/**
 * Muharrir qo'shimchalari — hammasi TipTap'ning tayyor qo'shimchalari (o'zimiz o'ylab topgan qoida yo'q):
 * Typography (`->` →, `!=` ≠, `+/-` ±, `(c)` ©, `1/2` ½, `2*3` 2×3), Mathematics (`$$x^2$$` → KaTeX formula).
 * `^2` → ² qoidasi o'chirilgan: LaTeX yozishga xalaqit beradi. Aqlli tirnoqlar ham o'chirilgan (o‘ g‘ apostroflari).
 */
export function createExtensions({ onFormulaClick }: ExtensionOptions): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: false, linkOnPaste: false },
    }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
    Subscript,
    Superscript,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    SizedImage.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: false }),
    TableRow,
    withBackground(TableHeader as unknown as typeof TableCell),
    withBackground(TableCell),
    Typography.configure({
      superscriptTwo: false,
      superscriptThree: false,
      openDoubleQuote: false,
      closeDoubleQuote: false,
      openSingleQuote: false,
      closeSingleQuote: false,
      laquo: false,
      raquo: false,
    }),
    InlineMath.configure({
      katexOptions: { throwOnError: false },
      onClick: (node, pos) => onFormulaClick({ pos, latex: String(node.attrs.latex ?? "") }),
    }),
    Callout,
  ];
}

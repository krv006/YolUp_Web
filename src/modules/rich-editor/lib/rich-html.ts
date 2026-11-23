import DOMPurify from "dompurify";

/**
 * Vazifa matni (rich HTML) ni ko'rsatishdan oldin tozalash. Backend (`apps/homework/html_clean.py`) saqlashda
 * allaqachon tozalaydi — bu ikkinchi himoya qatlami (eski ma'lumot, boshqa manba). Ro'yxatlar bir xil.
 */
const TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "code", "pre", "mark", "span", "div", "hr",
  "h1", "h2", "h3", "blockquote", "ul", "ol", "li", "a", "img",
  "table", "colgroup", "col", "thead", "tbody", "tr", "th", "td",
];
const ATTRS = [
  "href", "target", "rel", "src", "alt", "style", "class", "data-type", "data-latex", "data-color",
  "colspan", "rowspan", "data-colwidth", "start",
];

const purify = DOMPurify(window);
const STYLE_PROPS = new Set(["color", "background-color", "font-family", "font-size", "text-align", "width", "min-width"]);
const SAFE_VALUE = /^[\w\s#%.,()'"-]+$/;

function cleanStyle(value: string): string {
  const kept: string[] = [];
  for (const declaration of value.split(";")) {
    const index = declaration.indexOf(":");
    if (index < 0) continue;
    const prop = declaration.slice(0, index).trim().toLowerCase();
    const val = declaration.slice(index + 1).trim();
    if (!STYLE_PROPS.has(prop) || !val || val.length > 130) continue;
    if (!SAFE_VALUE.test(val) || /url\(|expression/i.test(val)) continue;
    kept.push(`${prop}: ${val}`);
  }
  return kept.join("; ");
}

purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.hasAttribute("style")) {
    const style = cleanStyle(node.getAttribute("style") ?? "");
    if (style) node.setAttribute("style", style);
    else node.removeAttribute("style");
  }
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer nofollow");
    node.setAttribute("target", "_blank");
  }
  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") ?? "";
    if (!/^(https?:)?\/\/|^\/media\//i.test(src)) node.removeAttribute("src");
  }
});

export function sanitizeRichHtml(html: string): string {
  return purify.sanitize(html ?? "", {
    ALLOWED_TAGS: TAGS,
    ALLOWED_ATTR: ATTRS,
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
    // Havola (href/src) emas — qiymati URL bo'lmagan atributlar (formula LaTeX'i "f: A \\to B" kabi ikki nuqtadan boshlanishi mumkin)
    ADD_URI_SAFE_ATTR: ["colspan", "rowspan", "data-colwidth", "start", "data-latex", "data-type", "data-color", "target", "rel"],
  });
}

const TITLE_MAX = 80;

/** Vazifa nomi — matnning birinchi bo'sh bo'lmagan qatori (sarlavha yoki gap); formula bo'lsa — uning LaTeX'i. */
export function richTitle(html: string, fallback = ""): string {
  if (!html) return fallback;
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const block of Array.from(doc.body.children)) {
    const text = (block.textContent ?? "").replace(/\s+/g, " ").trim();
    const latex = block.querySelector("[data-latex]")?.getAttribute("data-latex")?.trim() ?? "";
    const value = text || latex;
    if (value) return value.length > TITLE_MAX ? `${value.slice(0, TITLE_MAX).trimEnd()}…` : value;
  }
  return fallback;
}

/** Muharrirda hech narsa yo'qmi (matn, rasm, jadval, formula, chiziq, kod yo'q). */
export function isRichHtmlEmpty(html: string): boolean {
  if (!html) return true;
  const doc = new DOMParser().parseFromString(html, "text/html");
  if ((doc.body.textContent ?? "").trim()) return false;
  return !doc.body.querySelector("img,table,hr,[data-latex],pre");
}

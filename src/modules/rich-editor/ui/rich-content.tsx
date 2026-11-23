import { useEffect, useMemo, useRef } from "react";
import { sanitizeRichHtml } from "../lib/rich-html";

const LANGUAGE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  python: () => import("highlight.js/lib/languages/python"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  sql: () => import("highlight.js/lib/languages/sql"),
  java: () => import("highlight.js/lib/languages/java"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  css: () => import("highlight.js/lib/languages/css"),
  html: () => import("highlight.js/lib/languages/xml"),
};

type Katex = typeof import("katex").default;
type Highlighter = typeof import("highlight.js/lib/core").default;
let katexPromise: Promise<Katex> | null = null;
let highlightPromise: Promise<Highlighter> | null = null;
const registered = new Set<string>();

function loadKatex(): Promise<Katex> {
  katexPromise ??= Promise.all([import("katex"), import("katex/dist/katex.min.css")]).then(([module]) => module.default);
  return katexPromise;
}

function loadHighlighter(): Promise<Highlighter> {
  highlightPromise ??= import("highlight.js/lib/core").then((module) => module.default);
  return highlightPromise;
}

async function renderFormulas(root: HTMLElement) {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-type="inline-math"][data-latex]'));
  if (!nodes.length) return;
  const katex = await loadKatex();
  for (const node of nodes) {
    try {
      katex.render(node.dataset.latex ?? "", node, { throwOnError: false });
    } catch {
      node.textContent = node.dataset.latex ?? "";
    }
  }
}

async function highlightBlocks(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre code[class*='language-']"));
  if (!blocks.length) return;
  const hljs = await loadHighlighter();
  for (const block of blocks) {
    const language = /language-([a-z0-9+#_-]+)/.exec(block.className)?.[1] ?? "";
    const load = LANGUAGE_LOADERS[language];
    if (!load) continue;
    try {
      if (!registered.has(language)) {
        const module = await load();
        hljs.registerLanguage(language === "html" ? "xml" : language, module.default as never);
        registered.add(language);
      }
      const text = block.textContent ?? "";
      block.innerHTML = hljs.highlight(text, { language: language === "html" ? "xml" : language }).value;
    } catch {
      /* rangsiz qoladi */
    }
  }
}

/**
 * Vazifa matnini ko'rsatadi: HTML tozalanadi, formulalar (KaTeX) va kod (highlight.js) kerak bo'lganda yuklanib chiziladi.
 * Formula yoki kod bo'lmasa, bu kutubxonalar umuman yuklanmaydi.
 */
export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizeRichHtml(html), [html]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    void renderFormulas(root);
    void highlightBlocks(root);
  }, [clean]);

  if (!clean) return null;
  return <div ref={ref} className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

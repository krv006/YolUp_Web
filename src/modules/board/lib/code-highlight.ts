import type { HLJSApi, LanguageFn } from "highlight.js";
import type { CodeStrokeDto } from "../api/board.dto";

export const CODE_BACKGROUND = "#f6f8fa";
export const CODE_LINE_HEIGHT = 1.35;
export const CODE_PAD = 6;
export const CODE_CHAR_WIDTH = 0.6;
export const CODE_FONT = '"DejaVu Sans Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const CODE_COLORS = {
  keyword: "#d73a49",
  string: "#032f62",
  comment: "#6a737d",
  number: "#005cc5",
  function: "#6f42c1",
  type: "#e36209",
} as const;

const SCOPE_COLORS: Array<[string, string]> = [
  ["comment", CODE_COLORS.comment],
  ["quote", CODE_COLORS.comment],
  ["string", CODE_COLORS.string],
  ["regexp", CODE_COLORS.string],
  ["title", CODE_COLORS.function],
  ["built_in", CODE_COLORS.type],
  ["type", CODE_COLORS.type],
  ["keyword", CODE_COLORS.keyword],
  ["doctag", CODE_COLORS.keyword],
  ["name", CODE_COLORS.keyword],
  ["selector-tag", CODE_COLORS.keyword],
  ["number", CODE_COLORS.number],
  ["literal", CODE_COLORS.number],
  ["attr", CODE_COLORS.number],
  ["attribute", CODE_COLORS.number],
  ["symbol", CODE_COLORS.number],
  ["variable", CODE_COLORS.number],
  ["selector-class", CODE_COLORS.number],
  ["selector-id", CODE_COLORS.number],
];

const LANGUAGES: Record<string, () => Promise<{ default: LanguageFn }>> = {
  sql: () => import("highlight.js/lib/languages/sql"),
  python: () => import("highlight.js/lib/languages/python"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  html: () => import("highlight.js/lib/languages/xml"),
  css: () => import("highlight.js/lib/languages/css"),
  java: () => import("highlight.js/lib/languages/java"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  c: () => import("highlight.js/lib/languages/c"),
  php: () => import("highlight.js/lib/languages/php"),
  json: () => import("highlight.js/lib/languages/json"),
  bash: () => import("highlight.js/lib/languages/bash"),
};

const DETECT_RULES: Array<[string, RegExp]> = [
  ["html", /^\s*(<!doctype html|<html|<div|<body|<head|<p[ >]|<span|<ul|<h[1-6][ >])/i],
  [
    "sql",
    /^\s*(select\b[\s\S]*\bfrom\b|insert\s+into\b|update\b[\s\S]*\bset\b|delete\s+from\b|create\s+(table|database|index|view)\b|alter\s+table\b|drop\s+table\b)/i,
  ],
  [
    "python",
    /^\s*(def\s+\w+\s*\(|class\s+\w+.*:|import\s+\w+|from\s+[\w.]+\s+import\b|print\s*\(|if\s+.+:\s*$|for\s+\w+\s+in\s+.+:|elif\b|#!.*python)/m,
  ],
  ["java", /(\bpublic\s+(static\s+)?(class|void)\b|System\.out\.print)/],
  ["cpp", /(#include\s*<\w+>|std::|cout\s*<<|using\s+namespace\s+std)/],
  ["csharp", /(\busing\s+System\b|Console\.WriteLine|\bnamespace\s+\w+)/],
  ["php", /<\?php/],
  ["bash", /^(#!\/bin\/(ba)?sh|\s*(sudo|apt|cd|ls|echo|chmod|mkdir)\s)/m],
  ["json", /^\s*[[{]\s*("|\[|\{|\])/],
  ["css", /^\s*[.#]?[\w-]+\s*\{[^}]*:\s*[^}]*;/m],
  ["typescript", /(:\s*(string|number|boolean)\b|\binterface\s+\w+|\btype\s+\w+\s*=)/],
  ["javascript", /(\b(const|let|var)\s+\w+\s*=|\bfunction\s*\w*\s*\(|=>|console\.log|document\.)/],
  ["c", /(#include\s*<stdio\.h>|\bprintf\s*\(|\bint\s+main\s*\()/],
];

export interface CodeToken {
  text: string;
  color: string | null;
}

export function detectCodeLanguage(code: string): string {
  const sample = code.slice(0, 2000);
  return DETECT_RULES.find(([, pattern]) => pattern.test(sample))?.[0] ?? "plaintext";
}

export function codeLines(code: string): string[] {
  return code.replace(/\r\n/g, "\n").replace(/\t/g, "    ").split("\n");
}

function scopeColor(className: string): string | null {
  const scopes = className.split(/\s+/).map((name) => name.replace(/^hljs-/, "").replace(/_$/, ""));
  for (const [scope, color] of SCOPE_COLORS) {
    if (scopes.includes(scope)) return color;
  }
  return null;
}

export function highlightedLines(html: string): CodeToken[][] {
  const template = document.createElement("template");
  template.innerHTML = html;
  const lines: CodeToken[][] = [[]];

  function push(text: string, color: string | null) {
    text.split("\n").forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, color });
    });
  }

  function walk(node: Node, color: string | null) {
    if (node.nodeType === Node.TEXT_NODE) {
      push(node.textContent ?? "", color);
      return;
    }
    if (node instanceof Element) {
      const own = scopeColor(node.getAttribute("class") ?? "");
      node.childNodes.forEach((child) => walk(child, own ?? color));
    }
  }

  template.content.childNodes.forEach((child) => walk(child, null));
  return lines;
}

export function plainLines(code: string): CodeToken[][] {
  return codeLines(code).map((line) => (line ? [{ text: line, color: null }] : []));
}

let highlighter: Promise<HLJSApi> | null = null;

export function loadHighlighter(): Promise<HLJSApi> {
  highlighter ??= import("highlight.js/lib/core").then(async ({ default: hljs }) => {
    const modules = await Promise.all(
      Object.entries(LANGUAGES).map(async ([id, load]) => [id, (await load()).default] as const)
    );
    modules.forEach(([id, language]) => hljs.registerLanguage(id, language));
    return hljs;
  });
  return highlighter;
}

export function resolveLanguage(language: string | undefined, code: string): string {
  return !language || language === "auto" ? detectCodeLanguage(code) : language;
}

export function tokenizeCode(hljs: HLJSApi, code: string, language: string | undefined): CodeToken[][] {
  const resolved = resolveLanguage(language, code);
  if (!hljs.getLanguage(resolved)) return plainLines(code);
  const source = codeLines(code).join("\n");
  return highlightedLines(hljs.highlight(source, { language: resolved, ignoreIllegals: true }).value);
}

export function codeBoxWidth(stroke: Pick<CodeStrokeDto, "text" | "size" | "w">): number {
  const size = stroke.size ?? 20;
  const widest = Math.max(1, ...codeLines(String(stroke.text ?? "")).map((line) => line.length));
  return stroke.w ?? widest * size * CODE_CHAR_WIDTH + CODE_PAD * 2;
}

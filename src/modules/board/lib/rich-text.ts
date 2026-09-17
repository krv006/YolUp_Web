import type { TextLineDto, TextListKind, TextRunDto } from "../api/board.dto";

const BLOCK_TAGS = new Set(["DIV", "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE"]);
const MAX_LINES = 60;
const MAX_LINE_LENGTH = 400;

interface RunStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function styleOf(element: Element): RunStyle {
  const computed = window.getComputedStyle(element);
  const weight = Number.parseInt(computed.fontWeight, 10);
  return {
    bold: computed.fontWeight === "bold" || (Number.isFinite(weight) && weight >= 600),
    italic: computed.fontStyle === "italic" || computed.fontStyle === "oblique",
    underline: computed.textDecorationLine.includes("underline"),
  };
}

function listKindOf(element: Element | null, root: HTMLElement): TextListKind | undefined {
  let node: Element | null = element;
  while (node && node !== root) {
    if (node.tagName === "UL") return "bullet";
    if (node.tagName === "OL") return "number";
    node = node.parentElement;
  }
  return undefined;
}

function sameStyle(run: TextRunDto, style: RunStyle): boolean {
  return (
    Boolean(run.bold) === style.bold &&
    Boolean(run.italic) === style.italic &&
    Boolean(run.underline) === style.underline
  );
}

function makeRun(text: string, style: RunStyle): TextRunDto {
  const run: TextRunDto = { text };
  if (style.bold) run.bold = true;
  if (style.italic) run.italic = true;
  if (style.underline) run.underline = true;
  return run;
}

export function htmlToLines(root: HTMLElement): TextLineDto[] {
  const lines: TextLineDto[] = [];
  let current: TextLineDto = { runs: [] };

  function flush() {
    lines.push(current);
    current = { runs: [] };
  }

  function appendText(text: string, parent: Element) {
    if (!text) return;
    const style = styleOf(parent);
    const last = current.runs[current.runs.length - 1];
    if (last && sameStyle(last, style)) {
      last.text += text;
    } else {
      current.runs.push(makeRun(text, style));
    }
    const kind = listKindOf(parent, root);
    if (kind) current.list = kind;
  }

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText((node.textContent ?? "").replace(/\u00a0/g, " "), node.parentElement ?? root);
      return;
    }
    if (!(node instanceof Element)) return;
    if (node.tagName === "BR") {
      flush();
      return;
    }
    const isBlock = BLOCK_TAGS.has(node.tagName);
    if (isBlock && current.runs.length) flush();
    if (node.tagName === "LI") {
      const kind = listKindOf(node, root);
      if (kind) current.list = kind;
    }
    node.childNodes.forEach(walk);
    if (isBlock) flush();
  }

  root.childNodes.forEach(walk);
  if (current.runs.length || current.list) flush();

  const cleaned = lines
    .map((line) => ({
      ...line,
      runs: line.runs
        .map((run) => ({ ...run, text: run.text.slice(0, MAX_LINE_LENGTH) }))
        .filter((run) => run.text.length > 0),
    }))
    .filter((line, index, all) => line.runs.length > 0 || line.list || (index > 0 && index < all.length - 1));

  while (cleaned.length && !cleaned[cleaned.length - 1].runs.length) cleaned.pop();
  return cleaned.slice(0, MAX_LINES);
}

export function listMarkers(lines: readonly TextLineDto[]): string[] {
  let counter = 0;
  return lines.map((line) => {
    if (line.list === "number") {
      counter += 1;
      return `${counter}. `;
    }
    counter = 0;
    return line.list === "bullet" ? "• " : "";
  });
}

export function linesToPlainText(lines: readonly TextLineDto[]): string {
  const markers = listMarkers(lines);
  return lines.map((line, index) => markers[index] + line.runs.map((run) => run.text).join("")).join("\n");
}

export function hasRichFormatting(lines: readonly TextLineDto[]): boolean {
  return lines.some(
    (line) => Boolean(line.list) || line.runs.some((run) => run.bold || run.italic || run.underline)
  );
}

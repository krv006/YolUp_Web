export function formulaSnippet(latex: string): string {
  const clean = latex.replace(/\\placeholder\{\}/g, "").trim();
  return clean ? `$${clean}$` : "";
}

export function insertAt(value: string, snippet: string, start: number, end: number): { value: string; caret: number } {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  const before = value.slice(0, from);
  const after = value.slice(to);
  const left = before && !/\s$/.test(before) ? " " : "";
  const right = after && !/^\s/.test(after) ? " " : "";
  const next = `${before}${left}${snippet}${right}${after}`;
  return { value: next, caret: before.length + left.length + snippet.length + right.length };
}

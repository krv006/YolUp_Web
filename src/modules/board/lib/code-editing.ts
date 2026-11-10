export const CODE_INDENT = "    ";

export interface CodeEdit {
  value: string;
  start: number;
  end: number;
}

function lineStart(value: string, index: number): number {
  return value.lastIndexOf("\n", index - 1) + 1;
}

function touchedLineStarts(value: string, start: number, end: number): number[] {
  const starts = [lineStart(value, start)];
  const last = end > start && value[end - 1] === "\n" ? end - 1 : end;
  for (let index = value.indexOf("\n", starts[0]); index !== -1 && index < last; index = value.indexOf("\n", index + 1)) {
    starts.push(index + 1);
  }
  return starts;
}

export function indentCode(value: string, start: number, end: number): CodeEdit {
  if (start === end || !value.slice(start, end).includes("\n")) {
    const next = value.slice(0, start) + CODE_INDENT + value.slice(end);
    const caret = start + CODE_INDENT.length;
    return { value: next, start: caret, end: caret };
  }
  const starts = touchedLineStarts(value, start, end);
  let next = value;
  for (const position of [...starts].reverse()) next = next.slice(0, position) + CODE_INDENT + next.slice(position);
  return { value: next, start: start + CODE_INDENT.length, end: end + CODE_INDENT.length * starts.length };
}

export function outdentCode(value: string, start: number, end: number): CodeEdit {
  const starts = touchedLineStarts(value, start, end);
  let next = value;
  let removedBeforeStart = 0;
  let removedTotal = 0;
  for (const position of [...starts].reverse()) {
    const spaces = /^ {1,4}/.exec(next.slice(position))?.[0].length ?? 0;
    if (!spaces) continue;
    next = next.slice(0, position) + next.slice(position + spaces);
    removedTotal += spaces;
    if (position < start) removedBeforeStart += Math.min(spaces, start - position);
  }
  const nextStart = start - removedBeforeStart;
  return { value: next, start: nextStart, end: Math.max(nextStart, end - removedTotal) };
}

export function newlineWithIndent(value: string, start: number, end: number): CodeEdit {
  const before = value.slice(lineStart(value, start), start);
  const indent = /^[ \t]*/.exec(before)?.[0] ?? "";
  const opens = /[:{([]\s*$/.test(before);
  const insert = `\n${indent}${opens ? CODE_INDENT : ""}`;
  const caret = start + insert.length;
  return { value: value.slice(0, start) + insert + value.slice(end), start: caret, end: caret };
}

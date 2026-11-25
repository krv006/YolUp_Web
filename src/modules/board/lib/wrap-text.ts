export function wrapToWidth(text: string, maxWidth: number, measure: (value: string) => number): string {
  if (maxWidth <= 0) return text;
  return text
    .split("\n")
    .map((line) => wrapLine(line, maxWidth, measure))
    .join("\n");
}

function wrapLine(line: string, maxWidth: number, measure: (value: string) => number): string {
  if (measure(line) <= maxWidth) return line;
  const rows: string[] = [];
  let current = "";
  for (const part of line.split(/(\s+)/)) {
    if (!part) continue;
    const next = current + part;
    if (measure(next) <= maxWidth) {
      current = next;
      continue;
    }
    if (current.trim()) rows.push(current.trimEnd());
    current = /^\s+$/.test(part) ? "" : part;
    while (current && measure(current) > maxWidth) {
      let cut = current.length - 1;
      while (cut > 1 && measure(current.slice(0, cut)) > maxWidth) cut -= 1;
      rows.push(current.slice(0, cut));
      current = current.slice(cut);
    }
  }
  if (current) rows.push(current);
  return rows.join("\n");
}

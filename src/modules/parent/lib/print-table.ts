import { element, printFrame } from "./print-frame";

export interface PrintableTable {
  documentTitle: string;
  heading: string;
  subtitle: string;
  summary: Array<{ label: string; value: string }>;
  columns: string[];
  rows: string[][];
}

const STYLE = `
  @page { size: A4 landscape; margin: 16mm; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1b1f3b; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  p { margin: 0; color: #5b6075; font-size: 13px; }
  .summary { display: flex; gap: 28px; margin: 18px 0; }
  .summary span { font-size: 12px; color: #5b6075; }
  .summary strong { display: block; font-size: 18px; color: #1b1f3b; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #dfe3ee; color: #5b6075; font-weight: 600; }
  td { padding: 8px; border-bottom: 1px solid #eef0f5; }
`;

export function printTable({ documentTitle, heading, subtitle, summary, columns, rows }: PrintableTable): void {
  printFrame(documentTitle, STYLE, (doc) => {
    const facts = element(doc, "div", undefined, "summary");
    for (const item of summary) {
      const box = element(doc, "span", item.label);
      box.prepend(element(doc, "strong", item.value));
      facts.append(box);
    }
    const table = element(doc, "table");
    const head = element(doc, "tr");
    for (const column of columns) head.append(element(doc, "th", column));
    table.append(head);
    for (const row of rows) {
      const line = element(doc, "tr");
      for (const cell of row) line.append(element(doc, "td", cell));
      table.append(line);
    }
    return [element(doc, "h1", heading), element(doc, "p", subtitle), facts, table];
  });
}

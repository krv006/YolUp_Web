export interface PrintableCredentials {
  documentTitle: string;
  heading: string;
  subtitle: string;
  rows: Array<{ label: string; value: string }>;
  note: string;
}

const STYLE = `
  body { margin: 48px; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1b1f3b; }
  h1 { margin: 0 0 6px; font-size: 24px; }
  p { margin: 0; color: #5b6075; font-size: 14px; }
  dl { margin: 28px 0; padding: 20px 24px; border: 1px solid #dfe3ee; border-radius: 16px; }
  dt { margin-top: 14px; color: #5b6075; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
  dt:first-child { margin-top: 0; }
  dd { margin: 4px 0 0; font: 600 22px/1.3 ui-monospace, Menlo, monospace; }
  .note { padding: 12px 16px; border-radius: 12px; background: #fff7e6; color: #8a5a00; }
`;

export function printCredentials({ documentTitle, heading, subtitle, rows, note }: PrintableCredentials): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.append(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.title = documentTitle;
  const style = doc.createElement("style");
  style.textContent = STYLE;
  doc.head.append(style);

  const title = doc.createElement("h1");
  title.textContent = heading;
  const lead = doc.createElement("p");
  lead.textContent = subtitle;
  const list = doc.createElement("dl");
  for (const row of rows) {
    const term = doc.createElement("dt");
    term.textContent = row.label;
    const value = doc.createElement("dd");
    value.textContent = row.value;
    list.append(term, value);
  }
  const warning = doc.createElement("p");
  warning.className = "note";
  warning.textContent = note;
  doc.body.append(title, lead, list, warning);

  win.addEventListener("afterprint", () => globalThis.setTimeout(() => frame.remove(), 0), { once: true });
  win.focus();
  win.print();
}

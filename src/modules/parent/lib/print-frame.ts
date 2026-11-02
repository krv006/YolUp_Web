export function printFrame(documentTitle: string, style: string, build: (doc: Document) => Node[]): void {
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
  const sheet = doc.createElement("style");
  sheet.textContent = style;
  doc.head.append(sheet);
  doc.body.append(...build(doc));
  win.addEventListener("afterprint", () => globalThis.setTimeout(() => frame.remove(), 0), { once: true });
  win.focus();
  win.print();
}

export function element(doc: Document, tag: string, text?: string, className?: string): HTMLElement {
  const node = doc.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

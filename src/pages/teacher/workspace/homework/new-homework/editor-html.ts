function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Eski vazifalarda matn oddiy (HTML'siz) bo'lishi mumkin: muharrirga abzaslarga ajratib beramiz. */
export function bodyToEditorHtml(body: string): string {
  if (!body.trim()) return "";
  if (/^\s*<[a-z][^>]*>/i.test(body)) return body; // tahrirlovchi chiqargan HTML har doim teg bilan boshlanadi
  return body
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

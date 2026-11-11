const GOOGLE_FORM_HOSTS = new Set(["docs.google.com", "forms.gle", "forms.google.com"]);
const MAX_URL_LENGTH = 500;

export function isGoogleFormUrl(value: string): boolean {
  const text = value.trim();
  if (!text || text.length > MAX_URL_LENGTH) return false;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !GOOGLE_FORM_HOSTS.has(host)) return false;
    return host !== "docs.google.com" || url.pathname.startsWith("/forms");
  } catch {
    return false;
  }
}

export function googleFormUrlInvalid(value: string): boolean {
  return Boolean(value.trim()) && !isGoogleFormUrl(value);
}

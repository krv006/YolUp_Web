export type GoogleImportSource = "google_doc" | "google_form";

export function detectGoogleSource(url: string): GoogleImportSource | null {
  const value = url.trim();
  if (/^https:\/\/forms\.gle\/\S+/i.test(value)) return "google_form";
  if (!/^https:\/\/docs\.google\.com\//i.test(value)) return null;
  if (/^https:\/\/docs\.google\.com\/forms\//i.test(value)) return "google_form";
  if (/^https:\/\/docs\.google\.com\/document\//i.test(value)) return "google_doc";
  return null;
}

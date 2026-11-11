const GOOGLE_FORM_URL = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)\S+$/i;

export function isGoogleFormUrl(value: string): boolean {
  return GOOGLE_FORM_URL.test(value.trim());
}

export function googleFormUrlInvalid(value: string): boolean {
  return Boolean(value.trim()) && !isGoogleFormUrl(value);
}

export const UZ_PHONE_LENGTH = 9;

export function formatUzPhone(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return parts.filter(Boolean).join(" ");
}

export function normalizeUzPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === UZ_PHONE_LENGTH) return `+998${digits}`;
  if (digits.length === UZ_PHONE_LENGTH + 3 && digits.startsWith("998")) return `+${digits}`;
  return value.trim();
}

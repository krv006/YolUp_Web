export function normalizeUzPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return value.trim();
}

export function maskUzPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^998/, "");
  if (digits.length < 9) return value;
  return `+998 ${digits.slice(0, 2)} ••• •• ${digits.slice(7, 9)}`;
}

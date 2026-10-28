export function shortDateTime(value: string | Date, months: string[]): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function shortDate(value: string | Date, months: string[]): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

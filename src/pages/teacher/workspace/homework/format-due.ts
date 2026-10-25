export function formatDue(value: string | null, months: string[]): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const month = (months[date.getMonth()] ?? "").toLowerCase();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()}-${month}, ${hours}:${minutes}`;
}

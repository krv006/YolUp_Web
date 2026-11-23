/** Server muddatni UTC (ISO) qaytaradi; o'qituvchi esa o'z vaqti bilan ko'radi va yozadi — shuning uchun mahalliy sana/soatga ajratamiz. */
export function splitDue(iso: string | null | undefined): { date: string; time: string } | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`,
    time: `${pad(due.getHours())}:${pad(due.getMinutes())}`,
  };
}

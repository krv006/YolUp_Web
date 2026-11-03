import { toIntlLocale } from "@/shared/i18n";

// Brauzerlarning `uz` Intl ma'lumotida oy nomlari to'liq emas (masalan "M11" chiqadi) — o'zbekchani o'zimiz formatlaymiz.
const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `2026-11-03T…` -> "03.11.2026" (uz) yoki mahalliy qisqa sana (ru/en). */
export function formatProgressDate(value: string, language: string): string {
  const date = new Date(value);
  if (language === "uz") return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  return new Intl.DateTimeFormat(toIntlLocale(language), { dateStyle: "medium" }).format(date);
}

/** `2026-11` -> "Noyabr 2026". */
export function formatProgressMonth(period: string, language: string): string {
  const [year, month] = period.split("-").map(Number);
  if (language === "uz") return `${UZ_MONTHS[month - 1] ?? period} ${year}`;
  return new Intl.DateTimeFormat(toIntlLocale(language), { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1, 12)
  );
}

/** 9000000 -> "9 000 000" (uz va ru bo'shliq bilan ajratadi). */
export function formatProgressMoney(value: number, language: string): string {
  return new Intl.NumberFormat(language === "uz" ? "ru-RU" : toIntlLocale(language)).format(value);
}

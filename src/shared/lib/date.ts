import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { i18n } from "@/shared/i18n";

const DATE_FNS_LOCALES = { uz, en: enUS, ru } as const;

function currentDateFnsLocale() {
  return DATE_FNS_LOCALES[i18n.language as keyof typeof DATE_FNS_LOCALES] ?? uz;
}

export function formatConversationTime(value: string | number | Date): string {
  const date = new Date(value);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return i18n.t("common:date.yesterday");
  return format(date, "dd MMM", { locale: currentDateFnsLocale() });
}

export function formatMessageTime(value: string | number | Date): string {
  return format(new Date(value), "HH:mm");
}

export function isSameLocalDay(a: string | number | Date, b: string | number | Date): boolean {
  return isSameDay(new Date(a), new Date(b));
}

function dayPattern(month: "MMM" | "MMMM", withYear: boolean): string {
  const year = withYear ? " yyyy" : "";
  if (i18n.language === "en") return `${month} d${withYear ? "," : ""}${year}`;
  if (i18n.language === "ru") return `d ${month}${year}`;
  return `d-${month}${year}`;
}

function localizedDay(date: Date, month: "MMM" | "MMMM"): string {
  const withYear = date.getFullYear() !== new Date().getFullYear();
  const text = format(date, dayPattern(month, withYear), { locale: currentDateFnsLocale() });
  return i18n.language === "uz" ? text.toLowerCase() : text;
}

export function formatDayLabel(value: string | number | Date): string {
  const date = new Date(value);
  if (isToday(date)) return i18n.t("common:date.today");
  if (isYesterday(date)) return i18n.t("common:date.yesterday");
  return localizedDay(date, "MMMM");
}

export function formatNotificationTime(value: string | number | Date): string {
  const date = new Date(value);
  const time = format(date, "HH:mm");
  if (isToday(date)) return time;
  if (isYesterday(date)) return `${i18n.t("common:date.yesterday")}, ${time}`;
  return `${localizedDay(date, "MMM")}, ${time}`;
}

export function formatDateTime(value: string | number | Date): string {
  return format(new Date(value), "dd MMM, HH:mm", { locale: currentDateFnsLocale() });
}

export function formatLocalized(value: string | number | Date, pattern: string): string {
  const raw = format(new Date(value), pattern, { locale: currentDateFnsLocale() });
  const text = i18n.language === "uz" ? raw.toLowerCase() : raw;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDayTime(value: string | number | Date): string {
  const date = new Date(value);
  const pattern =
    date.getFullYear() === new Date().getFullYear() ? "d-MMMM, HH:mm" : "d-MMMM yyyy, HH:mm";
  return format(date, pattern, { locale: currentDateFnsLocale() }).toLowerCase();
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  const h = i18n.t("common:date.hourUnit");
  const m = i18n.t("common:date.minuteUnit");
  const s = i18n.t("common:date.secondUnit");

  if (hours) return `${hours}${h} ${String(minutes).padStart(2, "0")}${m}`;
  if (minutes) return `${minutes}${m} ${String(rest).padStart(2, "0")}${s}`;
  return `${rest}${s}`;
}

export function formatRelativeShort(value: string | number | Date): string {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return i18n.t("common:relative.now");
  if (minutes < 60) return i18n.t("common:relative.minutes", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24 && isToday(date)) return i18n.t("common:relative.hours", { count: hours });
  if (isYesterday(date)) return i18n.t("common:relative.yesterday");
  return format(date, "d MMM", { locale: currentDateFnsLocale() });
}

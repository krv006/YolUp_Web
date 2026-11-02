import type { TFunction } from "i18next";
import { formatMessageTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";

export function lessonEnd(lesson: Lesson): string {
  return new Date(Date.parse(lesson.startsAt) + (lesson.durationMinutes || 0) * 60_000).toISOString();
}

export function clock(value: string | number): string {
  return formatMessageTime(value);
}

export function hoursMinutes(minutes: number, t: TFunction, prefix: "home.duration" | "home.recent"): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (prefix === "home.recent") return h ? t("home.recent.durationHours", { h, m }) : t("home.recent.durationMinutes", { m });
  return h ? t("home.duration.hours", { h, m }) : t("home.duration.minutes", { m });
}

export function greetingKey(now: number): "morning" | "day" | "evening" | "night" {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

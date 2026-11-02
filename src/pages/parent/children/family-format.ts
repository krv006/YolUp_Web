import type { TFunction } from "i18next";
import { formatLocalized, formatMessageTime } from "@/shared/lib";

export function visitWhen(at: string, now: number, t: TFunction, capitalize = false): string {
  const date = new Date(at);
  const key = date.toDateString();
  const day =
    key === new Date(now).toDateString()
      ? t("family.today")
      : key === new Date(now - 86_400_000).toDateString()
        ? t("family.yesterday")
        : formatLocalized(date, t("family.datePattern"));
  const text = `${day}, ${formatMessageTime(date)}`;
  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

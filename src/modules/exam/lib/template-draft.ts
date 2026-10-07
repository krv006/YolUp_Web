import type { ExamTemplateFormValues } from "../api/exam.dto";

export const MAX_TOTAL_MINUTES = 720;
export const MAX_SECTION_MINUTES = 300;
export const MAX_BREAK_MINUTES = 60;

export interface TemplateItemDraft {
  id: string;
  kind: "section" | "break";
  title: string;
  minutes: string;
  weight: string;
}

export type TemplateError =
  | "nameRequired"
  | "titleRequired"
  | "minutesInvalid"
  | "sectionMinutes"
  | "breakMinutes"
  | "totalMinutes"
  | "needSection"
  | "breakEdge"
  | "scaleInvalid"
  | "passPercentInvalid";

export function slugKey(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug || `item_${index + 1}`;
}

export function uniqueKeys(items: TemplateItemDraft[]): string[] {
  const used = new Set<string>();
  return items.map((item, index) => {
    let key = slugKey(item.title, index);
    let suffix = 2;
    while (used.has(key)) {
      key = `${slugKey(item.title, index)}_${suffix}`;
      suffix += 1;
    }
    used.add(key);
    return key;
  });
}

function minutesOf(item: TemplateItemDraft): number | null {
  const value = Number(item.minutes);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function validateTemplate(
  name: string,
  items: TemplateItemDraft[],
  scale: string,
  passPercent: string
): TemplateError | null {
  if (!name.trim()) return "nameRequired";
  if (!items.some((item) => item.kind === "section")) return "needSection";
  if (items[0]?.kind === "break" || items[items.length - 1]?.kind === "break") return "breakEdge";

  let total = 0;
  for (const item of items) {
    if (!item.title.trim()) return "titleRequired";
    const minutes = minutesOf(item);
    if (minutes === null) return "minutesInvalid";
    if (item.kind === "section" && minutes > MAX_SECTION_MINUTES) return "sectionMinutes";
    if (item.kind === "break" && minutes > MAX_BREAK_MINUTES) return "breakMinutes";
    total += minutes;
  }
  if (total > MAX_TOTAL_MINUTES) return "totalMinutes";

  const scaleValue = Number(scale);
  if (!Number.isInteger(scaleValue) || scaleValue < 1 || scaleValue > 1000) return "scaleInvalid";
  if (passPercent.trim()) {
    const percent = Number(passPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return "passPercentInvalid";
  }
  return null;
}

export function templateToForm(
  name: string,
  description: string,
  items: TemplateItemDraft[],
  scale: string,
  passPercent: string
): ExamTemplateFormValues {
  const keys = uniqueKeys(items);
  return {
    name: name.trim(),
    description: description.trim(),
    items: items.map((item, index) => ({
      kind: item.kind,
      key: keys[index],
      title: item.title.trim(),
      minutes: Number(item.minutes),
      ...(item.kind === "section" && Number(item.weight) > 1 ? { weight: Number(item.weight) } : {}),
    })),
    scale: Number(scale),
    passPercent: passPercent.trim() ? Number(passPercent) : null,
  };
}

export function templateTotalMinutes(items: TemplateItemDraft[]): number {
  return items.reduce((total, item) => total + (minutesOf(item) ?? 0), 0);
}

import { storage } from "@/shared/lib";

export interface SearchEntry {
  id: string;
  kind: "article" | "video" | "faq";
  title: string;
  text: string;
}

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchEntries<T extends SearchEntry>(entries: readonly T[], query: string): T[] {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  return entries
    .map((entry) => {
      const title = normalizeSearch(entry.title);
      const text = normalizeSearch(entry.text);
      if (!words.every((word) => title.includes(word) || text.includes(word))) return null;
      const score = words.reduce((sum, word) => sum + (title.startsWith(word) ? 3 : title.includes(word) ? 2 : 1), 0);
      return { entry, score };
    })
    .filter((item): item is { entry: T; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.entry);
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length || !text) return [{ text, match: false }];
  const normalized = text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'");
  const marks = new Array<boolean>(text.length).fill(false);
  for (const word of words) {
    let from = normalized.indexOf(word);
    while (from >= 0) {
      for (let index = from; index < from + word.length; index += 1) marks[index] = true;
      from = normalized.indexOf(word, from + word.length);
    }
  }
  const parts: HighlightPart[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const last = parts[parts.length - 1];
    if (last && last.match === marks[index]) last.text += text[index];
    else parts.push({ text: text[index], match: marks[index] });
  }
  return parts;
}

const RECENT_KEY = "yolup:help:recent";
const RECENT_LIMIT = 6;

export function recentSearches(): string[] {
  const value = storage.getJson<unknown>(RECENT_KEY, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, RECENT_LIMIT) : [];
}

export function rememberSearch(query: string): string[] {
  const value = query.trim();
  if (value.length < 2) return recentSearches();
  const next = [value, ...recentSearches().filter((item) => normalizeSearch(item) !== normalizeSearch(value))].slice(0, RECENT_LIMIT);
  storage.setJson(RECENT_KEY, next);
  return next;
}

export function clearRecentSearches(): string[] {
  storage.remove(RECENT_KEY);
  return [];
}

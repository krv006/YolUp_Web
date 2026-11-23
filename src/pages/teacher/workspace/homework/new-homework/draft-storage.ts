import type { DraftQuestion } from "@/modules/homework";
import type { GradingScale } from "@/shared/types";

const KEY = "yolup:homework-draft:v1";

/** Yangi vazifa qoralamasi (faqat shu brauzerda): chiqib ketilsa yoki sahifa yopilsa ham yozilgani yo'qolmaydi. */
export interface StoredDraft {
  html: string;
  group: string;
  date: string;
  time: string;
  grading: GradingScale;
  aiCheck: boolean;
  announce: boolean;
  googleFormUrl: string;
  questions: DraftQuestion[];
}

function isDraft(value: unknown): value is StoredDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.html === "string" &&
    typeof draft.group === "string" &&
    typeof draft.date === "string" &&
    typeof draft.time === "string" &&
    typeof draft.googleFormUrl === "string" &&
    Array.isArray(draft.questions)
  );
}

export function loadDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Saqlandimi (xotira to'lgan bo'lishi mumkin) — shunga qarab "qoralama saqlandi" deb yozamiz. */
export function saveDraft(draft: StoredDraft): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* brauzer saqlashga ruxsat bermaydi */
  }
}

/** Qoralamada saqlashga arziydigan narsa bormi. */
export function hasDraftContent(draft: Pick<StoredDraft, "html" | "questions" | "googleFormUrl">): boolean {
  return Boolean(draft.html || draft.questions.length || draft.googleFormUrl.trim());
}
